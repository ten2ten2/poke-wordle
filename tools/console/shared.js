export const $ = (id) => document.getElementById(id);
export const element = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};
export const languages = { 'zh-hans': '简体中文', 'zh-hant': '繁体中文', en: '英语', ja: '日语', ko: '韩语', es: '西班牙语', de: '德语', it: '意大利语', fr: '法语' };
export const fields = { ...languages, profile: '图片', id: '游戏 ID', pokedex_id_national: '全国图鉴编号', name: '标识名称', generation: '世代', types: '属性', abilities: '特性', base_stats_total: '种族值总和', evolution_stage: '进化阶段', evolution_method: '进化方式', evolution_method_detail: '进化分类', tags: '标签', hp: 'HP', attack: '攻击', defense: '防御', sp_attack: '特攻', sp_defense: '特防', speed: '速度', slug: '路径名称', title: '标题', createdAt: '创建时间' };
