import assert from "node:assert"
import { extractProductUrl } from "../src/lib/product-link.ts"

console.log("=== Sabuyship QA Mobile & Core Journey Test Suite ===\n")

// Test Case 1: Provided Taobao share text from user prompt
const sampleTaobaoShareText = `【淘宝】7天无理由退货 https://e.tb.cn/h.8HJxTkXig8Mr4HH?tk=ozdwTQtOtdp CZ007 「*CSB挂脖背心露背舒适弹力瑜伽服美背Form Athena Tank」\n点击链接直接打开 或者 淘宝搜索直接打开`
const extracted1 = extractProductUrl(sampleTaobaoShareText)
assert.strictEqual(extracted1, "https://e.tb.cn/h.8HJxTkXig8Mr4HH?tk=ozdwTQtOtdp", "Should extract exact Taobao short URL from share text")
console.log("PASS 1: User prompt Taobao share text extraction:", extracted1)

// Test Case 2: Pure 1688 product URL
const pure1688Url = "https://detail.1688.com/offer/612345678901.html"
assert.strictEqual(extractProductUrl(pure1688Url), pure1688Url, "Should accept pure 1688 URL")
console.log("PASS 2: Pure 1688 URL extraction:", pure1688Url)

// Test Case 3: Trailing Chinese punctuation
const trailingPunctuation = "https://detail.tmall.com/item.htm?id=998877665544。"
assert.strictEqual(extractProductUrl(trailingPunctuation), "https://detail.tmall.com/item.htm?id=998877665544", "Should strip trailing Chinese punctuation")
console.log("PASS 3: Trailing punctuation handling")

// Test Case 4: Multiline text with text before and after URL
const multilineText = `กระเป๋าเดินทางรุ่นใหม่\nhttps://item.taobao.com/item.htm?id=12345678\nสีดำ ไซส์ 24 นิ้ว 2 ใบ`
assert.strictEqual(extractProductUrl(multilineText), "https://item.taobao.com/item.htm?id=12345678", "Should extract URL between Thai lines")
console.log("PASS 4: Multiline text with text before and after URL")

// Test Case 5: Text without any URL
const noUrlText = "ไม่มีลิงก์สินค้า เสื้อยืดสีขาว ไซส์ L จำนวน 3 ตัว"
assert.strictEqual(extractProductUrl(noUrlText), null, "Should return null for text without URL")
console.log("PASS 5: Text without URL returns null for validation")

// Test Case 6: URL with Chinese brackets around it
const bracketedUrl = "【https://e.tb.cn/h.8HJxTkXig8Mr4HH?tk=ozdwTQtOtdp】"
assert.strictEqual(extractProductUrl(bracketedUrl), "https://e.tb.cn/h.8HJxTkXig8Mr4HH?tk=ozdwTQtOtdp", "Should extract URL enclosed in Chinese brackets")
console.log("PASS 6: Bracketed URL extraction")

console.log("\nAll QA verification test cases PASSED successfully!")
