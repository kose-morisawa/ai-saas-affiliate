# 意思決定ログ（ADR）

## 2026-05-26 — Claude Code課金のみでシステム構築
- **決定**：外部Anthropic APIは使わない。AI作業はすべてClaude Codeセッション内のサブエージェントで処理
- **理由**：Claude Code Maxプランの利用枠を最大活用し、追加API課金ゼロを実現
- **影響**：GitHub ActionsはAI不使用（データ取得・デプロイのみ）。毎日1回Claude Codeセッションを起動して記事生成を実行する運用

## 2026-05-26 — ホスティングはCloudflare Pages
- **決定**：Vercel HobbyではなくCloudflare Pagesを使用
- **理由**：Vercel Hobbyの利用規約で商業利用（アドセンス・アフィリエイト含む）が禁止されているため

## 2026-05-26 — ジャンルはAI/SaaS×開発者ツール特化
- **決定**：YMYLを避け、技術者向けAI/SaaSツール比較に特化
- **理由**：API取得可能な一次データが豊富、ASP高単価案件あり、YouTubeの「ねこままAIツール大学」との親和性が高い
