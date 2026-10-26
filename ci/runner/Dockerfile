# Runner Gitea Actions en mode hote : pas de daemon Docker, donc ni conteneur
# privilegie ni espace de noms utilisateur. Les etapes d'un workflow s'executent
# dans ce conteneur ; les images sont construites par un Job Kaniko separe
# (voir k8s/gitea/ci-builds.yaml).
FROM gitea/runner:5.2.2
RUN apk add --no-cache nodejs npm curl gettext kubectl \
 && adduser -D -u 1000 runner
USER 1000
