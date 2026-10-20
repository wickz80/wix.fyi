# Phosphor Loop infrastructure

Infrastructure code: [host-stack.ts](../cdk/lib/host-stack.ts).
To inspect proposed changes against AWS, run `cd cdk && npx cdk diff HostStack`.
Generated diff snapshots are not maintained in this repository.

All permanent app infrastructure is in `cdk/lib/host-stack.ts`: a retained private
bucket with encryption/public-access blocking/HTTPS enforcement, CloudFront
origin access identity, `/loop` and `/loop/*` behaviors, redirect/prefix-rewrite
function, and the GitHub OIDC deployment role. The app publishes bucket-root files;
CloudFront strips the public `/loop` prefix. No root website bucket permissions
are granted to the app role. No manually maintained console settings are needed.

Deploy CDK through this repo's normal main-branch workflow. The app workflow in
wickz80/phosphor-loop-min only uploads its files and invalidates the loop paths.
Use the stack outputs to update its `deploy/production.json` if resource IDs move.
The shared GitHub OIDC provider is the one already used by this website.

`cd cdk && npm test -- --runInBand` verifies routing, isolation, retention, and
OIDC trust. `npx cdk diff HostStack` compares current source with deployed state;
after deployment, the new app resources should no longer appear as additions.
