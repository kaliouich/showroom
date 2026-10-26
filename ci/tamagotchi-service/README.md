# Pipeline du depot khalil/tamagotchi-service

Ces fichiers vivent dans le depot Gitea `khalil/tamagotchi-service` (prive) ; ils sont
gardes ici pour etre relus et versionnes avec le reste de l'infrastructure.

- `.gitea/workflows/ci.yaml` -> meme chemin dans le depot ;
- `kaniko-job.yaml` -> `ci/kaniko-job.yaml` dans le depot.

Le runner ([k8s/gitea/act-runner.yaml](../../k8s/gitea/act-runner.yaml)) n'a ni daemon Docker ni
privilege : il cree un Job Kaniko par image dans le namespace `ci-builds`
([k8s/gitea/ci-builds.yaml](../../k8s/gitea/ci-builds.yaml)). Mise en place :
`scripts/setup-ci-builds.sh`.
