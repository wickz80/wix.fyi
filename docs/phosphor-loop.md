# Phosphor Loop infrastructure

Infrastructure code:

- [phosphor-loop-stack.ts](../cdk/lib/phosphor-loop-stack.ts): retained private
  bucket, encryption/public-access blocking/HTTPS enforcement, origin access
  identity, and the GitHub OIDC deployment role. Add future app session storage,
  APIs, and integrations here.
- [host-stack.ts](../cdk/lib/host-stack.ts): shared domain/certificate/distribution,
  `/loop` and `/loop/*` routing, cache isolation, redirect/prefix rewrite, and the
  distribution-specific invalidation grant attached to the app role.

The website stack depends on the app stack. The app stack has no reverse
reference, so it can deploy future backend changes independently:
`cd cdk && npx cdk deploy PhosphorLoopStack --exclusively`.
Changes to the shared URL routing still deploy HostStack.

The website main-branch workflow deploys both stacks in dependency order and
publishes Gatsby only to its original bucket. App main-branch pushes only upload
the app bucket's root files and invalidate `/loop` paths; they do not run CDK.
CloudFront strips the public `/loop` prefix. No write permissions for the root
website bucket are granted to the app role. The existing account-wide GitHub
OIDC provider is reused.

Use `cd cdk && npm test -- --runInBand` for infrastructure checks and
`npx cdk diff PhosphorLoopStack HostStack` to inspect proposed changes. Generated
diffs and migration templates are not committed. Deployment identifiers in the
app repo's `deploy/production.json` remain unchanged after the stack split.

## Existing-resource migration

The original resources were created in HostStack. Merely moving CDK constructs
would attempt to recreate the named bucket and role. The migration uses
[CloudFormation stack refactoring](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stack-refactoring.html)
to move the existing bucket, bucket policy, OAI, role, and S3 role policy without
replacing resources or copying objects. The distribution stays in HostStack.

[split-phosphor-loop.py](../cdk/migrations/split-phosphor-loop.py) records that
migration. It preserves the live website template so unrelated Gatsby assets
cannot be included accidentally. This is a migration for the original deployment,
not a step to rerun on already-migrated stacks or a fresh install.

From `cdk`, after `npx cdk synth`:

```sh
python3 migrations/split-phosphor-loop.py prepare --workdir /tmp/phosphor-stack-split
aws cloudformation wait change-set-create-complete --stack-name HostStack --change-set-name prepare-phosphor-stack-split
aws cloudformation describe-change-set --stack-name HostStack --change-set-name prepare-phosphor-stack-split
# Expect one new invalidation IAM policy and in-place policy/OAI updates, no replacements.
aws cloudformation execute-change-set --stack-name HostStack --change-set-name prepare-phosphor-stack-split
aws cloudformation wait stack-update-complete --stack-name HostStack
python3 migrations/split-phosphor-loop.py plan --workdir /tmp/phosphor-stack-split
python3 migrations/split-phosphor-loop.py inspect --workdir /tmp/phosphor-stack-split
# Once CREATE_COMPLETE, expect five MOVE resource actions and one CREATE stack action.
python3 migrations/split-phosphor-loop.py execute --workdir /tmp/phosphor-stack-split
python3 migrations/split-phosphor-loop.py inspect --workdir /tmp/phosphor-stack-split
# After ExecutionStatus EXECUTE_COMPLETE, normal CDK deployment normalizes metadata.
npx cdk deploy PhosphorLoopStack HostStack
```

Fresh installations simply deploy both stacks normally; no migration is needed.

GitHub OIDC trust uses the immutable subject for this repo (created after GitHub's
July 2026 rollout):
`repo:wickz80@32722332/phosphor-loop-min@1424659759:ref:refs/heads/main`.
These IDs come from the repository's public GitHub metadata. The older website
repo retains its own existing subject format. See
[GitHub's subject format change](https://github.blog/changelog/2026-04-23-immutable-subject-claims-for-github-actions-oidc-tokens/).
