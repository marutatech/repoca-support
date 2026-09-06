# repoca-support

Repoca サポートサイト（GitHub Pages）。

公開 URL: https://marutatech.github.io/repoca-support/

## お知らせの唯一の更新元

**`notices.json` だけを編集・commit・push**してください。

これにより次が自動反映されます。

1. Repoca Home（最大3件）
2. Repoca アプリ内お知らせ詳細
3. Web `news.html`（全件一覧）

アプリ本体の JS や `news.html` に個別のお知らせ本文を書かないでください。

### 反映手順

1. このリポジトリ（`marutatech/repoca-support`）で `notices.json` を編集
2. `main` に commit / push
3. GitHub Pages 反映後、次を確認
   - https://marutatech.github.io/repoca-support/notices.json
   - https://marutatech.github.io/repoca-support/news.html

### ID 運用（重要）

- `id` はアプリの既読判定キーです
- **公開後に id を変更しない**
- 同じ id で title/body だけ変えても、既読ユーザーには NEW が付きません
- 再通知したい場合は **新しい id** を発行する

推奨 id 例: `2026-09-001`, `2026-09-002`

### date

`YYYY-MM-DD`（例: `2026-09-20`）

並びはアプリ／Webとも **date 降順 → 同日は id 降順**（JSON 配列順には依存しません）。

### type

| type | 用途 | 表示ラベル例 |
|------|------|----------------|
| `info` | 一般 | （なし） |
| `update` | アプリ更新 | アップデート |
| `partner` | メーカー等のご案内 | メーカーからのお知らせ / Home では PR |
| `maintenance` | メンテ | メンテナンス |
| `campaign` | キャンペーン | キャンペーン |

未知の type でもクラッシュせず通常お知らせとして扱います。

### platform

| 値 | 意味 |
|----|------|
| `all` | iOS / Android 両方（通常運用） |
| `ios` | iOS のみ（Home / Detail） |
| `android` | Android のみ（Home / Detail） |

Web `news.html` は platform に関係なく全件表示します。

### アップデート告知の手順

1. iOS 正式公開
2. Android 正式公開
3. 両ストア反映を確認
4. `notices.json` に `type: "update"` / 通常は `platform: "all"` で追加

正式告知前に「アップデートしました」等の本番文言を載せないでください。

### メーカー案内の追加例

```json
{
  "id": "2026-09-010",
  "date": "2026-09-22",
  "title": "○○社 新商品のご案内",
  "body": "業務用清掃用品の新商品をご案内します。",
  "type": "partner",
  "platform": "all",
  "externalLink": {
    "label": "商品ページを見る",
    "url": "https://example.com/product"
  }
}
```

### 1件追加テンプレート

必須: `id`, `date`, `title`, `body`  
任意: `type`, `platform`, `externalLink`, `storeLinks`

```json
{
  "id": "2026-09-011",
  "date": "2026-09-25",
  "title": "タイトル",
  "body": "本文（改行可・HTML不可）",
  "type": "info",
  "platform": "all",
  "externalLink": null,
  "storeLinks": {
    "ios": "https://apps.apple.com/app/id6789023940",
    "android": "https://play.google.com/store/apps/details?id=jp.co.daisei.repoca"
  }
}
```

`id` の重複は禁止です。

### 関連ファイル

| ファイル | 役割 |
|----------|------|
| `notices.json` | **お知らせ内容の唯一ソース** |
| `news.html` / `news.js` | JSON を fetch して一覧表示（本文ハードコードなし） |
| `style.css` | 共通スタイル |
| `usage.html` 等 | 使い方・法務ページ（お知らせ本文とは独立） |
