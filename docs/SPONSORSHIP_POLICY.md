# Sponsorship policy review

Reviewed 2026-10-29. This is a technical review, not approval from Google or a payment provider.

| Check | Status | Evidence / limitation |
|---|---|---|
| Explicit opt-in, no repeated prompts, no paywall/advertising | PASS | Manage button opens a local dialog only after click; all original features remain available |
| Local images and no payment/account logging | PASS | Static non-payable SVG placeholders; no payment API, wallet integration or account logging |
| Chrome policy compatibility | UNKNOWN | Design is consistent with transparent voluntary support as an inference, but the policy does not expressly approve this specific QR/address implementation; only Google review can decide |
| WeChat remote receipt eligibility | UNKNOWN | No real QR, account type, agreements or provider authorization supplied; do not treat API/commercial-code documentation as permission for personal remote receipts |
| Alipay remote receipt eligibility | UNKNOWN | General official collection-code help is not authorization for this account or this online sponsorship use |
| Polygon address | PASS for format only | 0x plus 40 hex digits; checksum, ownership, receipt capability, supported asset and jurisdiction eligibility UNKNOWN |
| Real payment acceptance | UNKNOWN | No transactions initiated or tested; no payment QR generated |

Official references:

- [Chrome Web Store Program Policies](https://developer.chrome.com/docs/webstore/program-policies/policies): minimum permissions, privacy, intellectual property, accepting payments, misleading behavior. No guarantee that a passive crypto address is accepted or that a listing is featured.
- [Chrome review process](https://developer.chrome.com/docs/webstore/review-process): actual review remains outstanding.
- [WeChat collection application/undertaking](https://gtimg.wechatpay.cn/resource/xres/mmpaydoc/static/attachment/3a5840a05b6abd63f60f6f0250fda124.pdf): a specific API application context, not blanket authorization for static personal codes.
- [Alipay official help](https://cschannel.alipay.com/mobile/helpDetail.htm?help_id=201602661432): collection-code information, not a decision on developer sponsorship.

Before replacing placeholders, obtain genuine owner-supplied receiving codes, verify provider/account eligibility for publicly distributed remote sponsorship, remove personal metadata, and review the visible payee information. Keep them local. Do not publish private payment codes or log account information. Public wallet addresses intentionally provided for receiving are distinct from private keys; never request keys or seed phrases.
