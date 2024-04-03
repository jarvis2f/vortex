## 安装教程

## Docker运行

创建一个目录 `vortex`， 然后将以下文件复制到该目录中：

```bash
mkdir vortex && cd vortex
```

1. [.env.example](.env.example) 文件复制到 `.env` 并填写环境变量，参考下方的环境变量配置。
2. [docker-compose.yml](docker%2Fdocker-compose.yml) 文件复制到项目的根目录。

创建 `redis` 文件夹，并将 [redis.conf](docker%2Fredis.conf) 文件复制到 `redis` 文件夹中，并修改密码。

```bash
mkdir redis && cd redis
```

- `redis.conf` 865 行，修改 `{your_password}` 的值为你的密码，这个为 vortex 连接密码。
- `redis.conf` 1045 行，修改 `requirepass {your_password}` 的值为你的密码。

启动容器
需要开放两个端口，一个是 vortex 面板的端口，一个是 redis 的端口，agent 会连接 redis。

```bash
docker-compose up -d
```

## agent 安装

第一个注册用户默认为管理员，登录之后需要在用户列表中给自己添加 `AGENT_PROVIDER` 的角色，然后才可以添加 agent。

面板启动后，在服务器界面新增一个 agent 后， 界面会显示 agent 的安装命令，复制命令到服务器执行即可。

## 环境变量

### PostgreSQL

postgreSQL 容器启动配置的环境变量

- POSTGRES_USER="postgres"
- POSTGRES_PASSWORD="123456"
- POSTGRES_DB="vortex"

vortex 容器连接 postgreSQL 的配置

DATABASE_URL="postgresql://vortex:123456@vortex-postgres:5432/vortex"

### Redis

- REDIS_URL=redis://vortex-redis:6379
- REDIS_USERNAME=vortex-main # vortex 连接 redis 的用户名
- REDIS_PASSWORD= # 上方配置的 vortex 连接的密码
- REDIS_DB=0
- AGENT_REDIS_URL=redis://{ip}:{port} # agent 可以连接到 redis 的地址

### Next Auth

- NEXTAUTH_URL={url} # 你的域名
- NEXTAUTH_SECRET={secret} # `openssl rand -base64 32` 生成的随机字符串
- EMAIL_SERVER={smtp} # SMTP 服务器地址，类似于smtp://username:password@smtp.example.com:587
- EMAIL_FROM={email} # 发送邮件的邮箱

邮箱可选择使用 [Resend](https://resend.com) 提供的免费 SMTP 服务，支持 100 封邮件/天。

#### 可选的第三方登录配置

GitHub OAuth 配置

- GITHUB_CLIENT_ID= # GitHub OAuth App 的 Client ID
- GITHUB_CLIENT_SECRET= # GitHub OAuth App 的 Client Secret

Google OAuth 配置

- GOOGLE_CLIENT_ID= # Google OAuth App 的 Client ID
- GOOGLE_CLIENT_SECRET= # Google OAuth App 的 Client Secret

### Depay

USDT / USDC 支付配置， 请参考 [Depay](https://depay.com) 的文档。

- DEPAY_INTEGRATION_ID= # Depay 的 Integration ID
- DEPAY_PUBLIC_KEY= # Depay 的 Public Key

### 其它

- SERVER_URL={url} # 你的域名，agent 会连接到这个地址
- AGENT_SHELL_URL={url} # agent 的 shell 脚本地址, 可以参考 vortex-agent/scripts/server.py 中的代码，使用 python 启动一个文件服务器，然后将文件放到这个地址内，或者直接使用 `https://raw.githubusercontent.com/jarvis2f/vortex-agent/main/scripts`

### Umami (可选)

使用 [Umami](https://umami.is) 分析网站访问量，需要配置以下环境变量。

- NEXT_PUBLIC_UMAMI_URL= # Umami 的访问地址
- NEXT_PUBLIC_UMAMI= # Umami 的 script.js 地址
- NEXT_PUBLIC_UMAMI_ID= # Umami 的 website id
