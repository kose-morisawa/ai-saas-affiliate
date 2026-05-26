# AI/SaaS アフィリエイトメディア 自動運用パイプライン

## ミッション
日本語でAIツール・開発者向けSaaSの比較・チュートリアル記事を、Claude Codeのサブエージェント群で完全自動生成・公開する。
**AI課金はClaude Codeプランのみ。外部Anthropic API課金は一切使わない。**

## アーキテクチャ原則
1. **AI作業はすべてこのClaude Codeセッション内で完結** — `@anthropic-ai/sdk` の直接呼び出しは禁止
2. **GitHubActionsはノーAI** — データ取得・Astroビルド・デプロイのみ
3. **品質 > 量** — 1記事に最低3つの一次データ引用（APIから取得した実値）
4. **YMYLなし** — 投資・医療・法律判断を含む記述は生成しない

## パイプライン（毎朝1コマンド）

### 実行方法
Claude Codeのターミナルで以下を実行：
```
本日の記事生成パイプラインを実行してください。data/raw/の最新JSONを読み込んで、trend-analyzerからpublisherまで順番に動かしてください。
```

### ワークフロー順序
1. **trend-analyzer** → `data/raw/` の最新JSONを読みテーマを選定
2. **outline-architect** → 競合分析してH2/H3構成を設計
3. **writer** → 6000〜8000字のMDX本文を執筆
4. **fact-checker** → 数値・日付・固有名詞を検証
5. **humanizer** → 自然さチェックと文体調整
6. **publisher** → `src/content/blog/` に配置、git commit & push

### データは事前にGitHub Actionsが準備済み
- `data/raw/YYYY-MM-DD.json` — GitHubトレンド・Product Hunt・HN
- `data/gsc/YYYY-MM-DD.json` — Search Console（CTR低・順位8-20のKW）

## サブエージェント呼び出し規則
- データ取得タスク → `data-collector` を使う（ローカルのdata/raw/が古い場合のみ）
- テーマ選定 → `trend-analyzer` を使う
- 構成設計 → `outline-architect` を使う
- 執筆タスク → `writer` を使う
- 検証タスク → `fact-checker` を使う
- 自然さ調整 → `humanizer` を使う
- 公開タスク → `publisher` を使う
- 週次分析 → `analyzer` を使う

## 禁止事項
- 投資判断・医療判断・法律判断を含む記述の生成
- 「絶対儲かる」「必ず稼げる」等の誇大表現
- AmazonページのスクリーンショットをMDXに埋め込む（規約違反）
- PRステッカーなしのアフィリエイト記事公開（景表法対応）
- 記事冒頭以外へのPR表記漏れ

## ASPリンク管理
アフィリエイトリンクは `data/asp-links.json` で一元管理。
記事内では `{{ASP_xserver_premium}}` 形式のプレースホルダーを使用。
publisher が実際のリンクに置換してからcommit。

## メモリ参照
- ASPルール: @.claude/memory/asp-rules.md
- 過去の意思決定: @.claude/memory/decisions.md
- 失敗事例: @.claude/memory/failures.md

## 週次レビュー（毎週月曜）
```
週次パフォーマンスレビューを実行してください。data/gsc/の直近7日分を読んで、analyzerでCTR・順位を確認し、改善が必要な記事をリストアップしてください。
```
