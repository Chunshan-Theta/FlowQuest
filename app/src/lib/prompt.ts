import { AgentProfile, CoursePackage, Unit, AgentMemory } from '@/types';

export function buildSystemPrompt(params: {
  agent: AgentProfile | null;
  unit: Unit | null;
  coursePackage: CoursePackage | null;
  context?: string;
  hotMemories?: AgentMemory[];
}) {
  const { agent, unit, coursePackage, context = '', hotMemories = [] } = params;

  if (!agent) return '你是一個學習助手，協助學習者完成學習任務。';

  let prompt = `你是 ${agent.name}，`;

  if (agent.persona) {
    if (agent.persona.background) prompt += `背景：${agent.persona.background} `;
    if (agent.persona.tone) prompt += `語調：${agent.persona.tone} `;
    if (agent.persona.voice) prompt += `說話風格：${agent.persona.voice} `;
  }

  if (coursePackage) {
    prompt += `\n\n當前課程：${coursePackage.title}`;
    if (coursePackage.description) {
      prompt += `\n課程描述：${coursePackage.description}`;
    }
  }

  if (unit) {
    if (unit.agent_role) prompt += `\n你在這個關卡的角色：${unit.agent_role}`;
    if (unit.user_role) prompt += `\n對方角色：${unit.user_role}`;
    if (unit.agent_behavior_prompt) prompt += `\n行為指引：${unit.agent_behavior_prompt}`;
  }

  if (context && hotMemories.length > 0) {
    prompt += `\n\n你的角色記憶：`;
    hotMemories.slice(0, 5).forEach((memory, index) => {
      prompt += `\n${index + 1}. ${memory.content}`;
      if (memory.tags.length > 0) {
        prompt += ` (標籤: ${memory.tags.join(', ')})`;
      }
    });
  }

  prompt += `\n\n請基於你的角色性格進行對話扮演，確保回應是符合覺色性格，並保持一致的回應立場在進行回應。`;
  console.log('--------------------------------');
  console.log('-----------System Prompt-----------');
  console.log(prompt);
  console.log('--------------------------------');
  return prompt;
} 