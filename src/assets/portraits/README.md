# 角色立绘替换说明

当前使用 `src/ui/portraits/PortraitSvg.tsx` 程序化生成的简洁风格头像作为占位（无图像生成工具可用）。

## 替换为真实立绘的步骤

1. 准备图片文件，命名规则：`/public/assets/portraits/{characterId}/{mood}.webp`
   - `characterId`：见 `src/ui/portraits/portraitAssets.ts` 中 `CHARACTER_PROFILES` 的 `id` 字段（`char-east` / `char-north` / `char-west`）
   - `mood`：`neutral` | `happy` | `worried` | `discarding`
2. 把图片放进对应目录，例如 `/public/assets/portraits/char-east/happy.webp`
3. 修改 `src/ui/portraits/portraitAssets.ts` 中的 `getPortraitSrc` 函数，让它对已经准备好的 `characterId`/`mood` 组合返回 `{ type: 'image', src: '/assets/portraits/...' }`
4. `PortraitCard.tsx` 已经根据 `getPortraitSrc` 的返回类型自动切换渲染真实图片或 SVG 占位，不需要改动其他代码
