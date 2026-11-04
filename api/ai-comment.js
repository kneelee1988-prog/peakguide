// Vercel 서버리스 함수: 등산 코스 AI 코멘트
// 브라우저는 코스·날씨·사용자 조건만 보내고, 프롬프트는 여기서 조립한다.
// (임의 프롬프트를 받지 않아 공개 엔드포인트가 범용 Claude 프록시로 악용되는 것을 막음)
// 필요한 환경변수: ANTHROPIC_API_KEY (Vercel 프로젝트 설정 → Environment Variables)

const sdk = require('@anthropic-ai/sdk');
const Anthropic = sdk.default || sdk;

const client = new Anthropic(); // ANTHROPIC_API_KEY 를 환경변수에서 읽음

const SYSTEM =
  '너는 한국 등산 앱 PeakGuide의 AI 가이드다. 주어진 코스와 오늘 조건을 보고 ' +
  '등산 코스 추천 코멘트를 2~3문장으로 쓴다. 반드시 한국어로, 친근하고 간결하게. ' +
  '머리말·목록·마크다운 없이 코멘트 본문만 출력한다.';

// 문자열 필드 정리: 길이 제한 + 줄바꿈 제거
function str(v, max) {
  if (v === undefined || v === null) return '';
  return String(v).replace(/[\r\n]+/g, ' ').trim().slice(0, max);
}

function buildPrompt(b) {
  const tags = Array.isArray(b.tags) ? b.tags.slice(0, 8).map((t) => str(t, 20)).join(', ') : '';
  const lines = [
    ['코스', str(b.name, 80)],
    ['위치', str(b.loc, 80)],
    ['거리', b.distKm ? `${str(b.distKm, 10)}km` : ''],
    ['고도', b.alt ? `${str(b.alt, 10)}m` : ''],
    ['코스 특성', tags],
    ['오늘 날씨', `기온 ${str(b.temp, 15)}, 풍속 ${str(b.wind, 15)}, 강수확률 ${str(b.rain, 15)}`],
    ['사용자 컨디션', b.cond ? `${str(b.cond, 5)}/100` : ''],
    ['경험 수준', str(b.level, 20)],
    ['우선순위', str(b.priority, 20)],
    ['매칭도', b.score ? `${str(b.score, 5)}%` : ''],
  ];
  return lines.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  // 다른 사이트에서 이 함수를 부르지 못하게: Origin이 있으면 같은 호스트만 허용
  const origin = req.headers.origin;
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.host) {
        return res.status(403).json({ error: 'forbidden' });
      }
    } catch (e) {
      return res.status(403).json({ error: 'forbidden' });
    }
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  if (!str(body.name, 80)) return res.status(400).json({ error: 'name_required' });

  try {
    const response = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 2000, // 생각 토큰 포함 상한. 코멘트 자체는 짧음
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default', // 안전 분류기가 거절하면 서버에서 다른 모델로 재시도
      system: SYSTEM,
      messages: [{ role: 'user', content: buildPrompt(body) }],
    });

    if (response.stop_reason === 'refusal') {
      return res.status(422).json({ error: 'refused' });
    }
    const comment = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
    if (!comment) return res.status(502).json({ error: 'empty' });

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ comment });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: 'rate_limited' });
    }
    if (error instanceof Anthropic.APIError) {
      console.error('Anthropic API error', error.status, error.message);
      return res.status(502).json({ error: 'upstream' });
    }
    console.error('ai-comment failed', error);
    return res.status(500).json({ error: 'internal' });
  }
};
