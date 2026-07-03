# 🚀 Guide d'accès au VPS (Oracle Cloud) et Configuration VS Code

Ce guide explique comment vous connecter à votre serveur d'infrastructure (Oracle Cloud) et comment configurer **Visual Studio Code (VS Code)** pour développer directement sur le serveur.

## 1. Informations de connexion

- **Adresse IP publique :** `88.96.58.76`
- **Utilisateur distant :** `ubuntu`
- **Clé SSH :** Votre clé privée (actuellement située sur votre machine locale sous le nom `khalil.aliouich@gmail.com-2026-06-28T08_23_02.949Z.pem`)

---

## 2. Accès depuis le Terminal (Linux / Mac / Windows WSL)

Pour vous connecter directement via le terminal, utilisez la commande suivante en ajustant le chemin vers votre clé SSH privée :

```bash
ssh -i /chemin/vers/votre/cle/khalil.aliouich@gmail.com-2026-06-28T08_23_02.949Z.pem ubuntu@88.96.58.76
```

---

## 3. Configuration de Visual Studio Code (Développement distant)

Grâce à l'extension **Remote - SSH**, vous pouvez éditer les fichiers de votre site web vitrine directement sur le VPS. Les modifications sur le site seront appliquées **en temps réel** grâce au montage de volume `hostPath` configuré sur Kubernetes.

### Étape A : Installer l'extension
1. Ouvrez VS Code.
2. Allez dans les Extensions (`Ctrl+Shift+X` ou `Cmd+Shift+X`).
3. Cherchez et installez l'extension **Remote - SSH** (publiée par Microsoft).

### Étape B : Configurer votre fichier SSH
1. Dans VS Code, appuyez sur `F1` (ou `Ctrl+Shift+P`).
2. Tapez **Remote-SSH: Open SSH Configuration File...** et sélectionnez-le.
3. Choisissez le fichier de configuration par défaut (souvent `~/.ssh/config` ou `C:\Users\VotreNom\.ssh\config`).
4. Ajoutez la configuration suivante à la fin du fichier :

```ssh-config
Host OCI-Showcase
    HostName 88.96.58.76
    User ubuntu
    IdentityFile /chemin/vers/votre/cle/khalil.aliouich@gmail.com-2026-06-28T08_23_02.949Z.pem
    StrictHostKeyChecking no
```
*(Attention : Remplacez `/chemin/vers/votre/cle/` par le chemin réel où est stockée votre clé sur votre ordinateur personnel)*.

### Étape C : Se connecter
1. Appuyez sur `F1` dans VS Code.
2. Tapez **Remote-SSH: Connect to Host...**
3. Sélectionnez **OCI-Showcase** dans la liste.
4. Une nouvelle fenêtre VS Code s'ouvrira, connectée directement à votre VPS.

### Étape D : Éditer le site web en direct
Une fois connecté via VS Code :
1. Allez dans **File > Open Folder...**
2. Entrez le chemin suivant : `/home/ubuntu/showcase-website/`
3. Cliquez sur **OK**.

Vous pouvez maintenant éditer directement `public/index.html`, `public/js/app.js` ou les fichiers CSS. Toute sauvegarde mettra instantanément le site à jour sur `https://khalilaliouich.com` grâce à la configuration `hostPath` que nous avons mise en place !
