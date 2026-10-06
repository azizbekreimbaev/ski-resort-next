# FAQ implementation and client handoff

FAQs are an extension beyond the unchanged DMM, implemented with the existing NestJS resolver/service/module pattern. The explicit collection is `faqs`.

Required fields are `faqQuestion`, `faqAnswer`, `faqStatus`, creator `memberId`, `_id` and timestamps. Question and answer are trimmed nonblank plain text. Status defaults to DRAFT or may be PUBLISHED. Duplicate questions are allowed. There are no images, categories, social interactions or custom ordering.

Public queries return only PUBLISHED FAQs; drafts and missing records return not found on public detail. All five admin operations use ADMIN RolesGuard and check the current database ACTIVE ADMIN state. Any active admin may manage any entry. Creator is derived from authentication and cannot be changed. Updates write only supplied content/status fields, preserve omitted status and reject empty updates or null required fields. Removal permanently deletes and returns the document without cascades.

## GraphQL operations

| Operation | Access | Return |
|---|---|---|
| `getFaq(faqId: String!)` | Public, published only | Faq |
| `getFaqs(input: FaqsInquiry!)` | Public, published only | Faqs |
| `getFaqByAdmin(faqId: String!)` | ACTIVE ADMIN | Faq |
| `getAllFaqsByAdmin(input: AllFaqsInquiry!)` | ACTIVE ADMIN | Faqs |
| `createFaq(input: FaqInput!)` | ACTIVE ADMIN | Faq |
| `updateFaqByAdmin(input: FaqUpdate!)` | ACTIVE ADMIN | Faq |
| `removeFaqByAdmin(faqId: String!)` | ACTIVE ADMIN | Removed Faq |

Both inquiries require page >= 1 and limit 1–100. Optional `search.text` performs literal case-insensitive question/answer substring matching. Admin search additionally accepts `faqStatus`. Sort supports `createdAt` and `updatedAt`; default is createdAt DESC with an `_id` tie-breaker. Direction uses ASC/DESC. Results contain `list` and `metaCounter { total }`; empty results have empty arrays.

## Client examples

POST JSON requests to the configured `/graphql` endpoint. Admin requests require `Authorization: Bearer <admin token>`.

```graphql
mutation CreateFaq($input: FaqInput!) {
  createFaq(input: $input) { _id faqQuestion faqAnswer faqStatus memberId createdAt updatedAt }
}
```

```json
{"input":{"faqQuestion":"Can I rent ski equipment?","faqAnswer":"Rental options are listed in the equipment catalog.","faqStatus":"PUBLISHED"}}
```

```graphql
query Faqs($input: FaqsInquiry!) {
  getFaqs(input: $input) {
    list { _id faqQuestion faqAnswer faqStatus }
    metaCounter { total }
  }
}
# Variables: {"input":{"page":1,"limit":20,"search":{"text":"rent"}}}

query Faq($faqId: String!) {
  getFaq(faqId: $faqId) { _id faqQuestion faqAnswer }
}
# Variables: {"faqId":"FAQ_ID"}

query AdminFaqs($input: AllFaqsInquiry!) {
  getAllFaqsByAdmin(input: $input) {
    list { _id faqQuestion faqAnswer faqStatus }
    metaCounter { total }
  }
}
# Variables: {"input":{"page":1,"limit":20,"search":{"faqStatus":"DRAFT"}}}

query AdminFaq($faqId: String!) {
  getFaqByAdmin(faqId: $faqId) { _id faqQuestion faqAnswer faqStatus }
}
# Variables: {"faqId":"FAQ_ID"}

mutation UpdateFaq($input: FaqUpdate!) {
  updateFaqByAdmin(input: $input) { _id faqQuestion faqAnswer faqStatus }
}
# Variables: {"input":{"_id":"FAQ_ID","faqAnswer":"Updated answer","faqStatus":"DRAFT"}}
# Set faqStatus to PUBLISHED to publish; omit it to preserve current status.

mutation RemoveFaq($faqId: String!) {
  removeFaqByAdmin(faqId: $faqId) { _id }
}
# Variables: {"faqId":"FAQ_ID"}
```

## Validation boundaries

See [completed tasks](COMPLETED_TASKS.md) for executed checks. Isolated tests use mocked persistence and generated GraphQL schemas; they do not establish live MongoDB aggregation, full bootstrap or deployed behavior. No frontend, live database migration or deployment is included.
