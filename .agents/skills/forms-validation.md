# React Hook Form and Zod

1. Define a Zod schema near the feature or in a shared validation module under `src/`; reuse it rather than maintaining duplicate validation rules. Infer types with `z.infer`, or distinguish `z.input` and `z.output` when transforms change values.
2. Implement interactive forms in a Client Component using React Hook Form and `zodResolver(schema)` from `@hookform/resolvers/zod`. Provide explicit default values and use controlled adapters only when necessary.
3. Associate labels and validation messages with fields, expose invalid state accessibly, and show submission, pending and API error states. Prevent unintended duplicate submissions.
4. Submit validated values through the feature service and map server validation failures to fields when appropriate. Client validation is a usability measure; the backend remains authoritative.
5. Test representative valid and invalid submissions, including transformed inputs and server errors when applicable.
