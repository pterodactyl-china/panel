# 翼龙面板 - Docker 镜像
这是一个将面板所需环境等全部准备好的 docker 镜像。

## 要求
此 docker 镜像需要一些额外的软件来运作。这些软件既可以在其他容器中提供（见 [docker-compose.yml](https://github.com/pterodactyl-china/panel/blob/develop/docker-compose.example.yml) 为例），也可以作为现有的实例。

需要一个 mysql 数据库。如果你喜欢在 docker 容器中运行它，我们推荐使用 [MariaDB Image](https://hub.docker.com/_/mariadb/) 镜像。作为一个非容器化的选择，我们推荐 mariadb。

还需要一个缓存软件。我们推荐使用 [Redis Image](https://hub.docker.com/_/redis/) 镜像。你可以选择任何一个[支持的选项](#缓存驱动程序)。

你可以使用自定义的 `.env` 文件或在 docker-compose 文件中设置适当的环境变量来提供额外的设置。

## 设置

启动 docker 容器和所需的依赖项（可以提供现有的依赖项，也可以同时启动容器，参见 [docker-compose.yml](https://github.com/pterodactyl-china/panel/blob/develop/docker-compose.example.yml) 文件为例。

启动完成后，您需要创建一个用户。
如果您在没有 docker-compose 的情况下运行 docker 容器，请使用：
```
docker exec -it <container id> php artisan p:user:make
```
如果您使用的是 docker compose，请使用
```
docker compose exec panel php artisan p:user:make
```

## 环境变量
当您不提供自己的 `.env` 文件时，有多个环境变量可以配置面板，有关每个可用选项的详细信息，请参见下表。

注意：如果您的 `APP_URL` 以 `https://` 开头，您还需要提供 `LE_EMAIL` 以便生成证书。

| 变量               | 描述                           | 必需项 |
|------------------|------------------------------|-----|
| `APP_URL`        | 可以访问面板的 URL（包括协议）            | 是   |
| `APP_TIMEZONE`   | 面板所使用的时区                     | 是   |
| `LE_EMAIL`       | 用于生成 letsencrypt 证书的邮箱       | 是   |
| `DB_HOST`        | MySQL 主机                     | 是   |
| `DB_PORT`        | MySQL 端口                     | 是   |
| `DB_DATABASE`    | MySQL 数据库名称                  | 是   |
| `DB_USERNAME`    | MySQL 用户名                    | 是   |
| `DB_PASSWORD`    | 指定用户的 MySQL 密码               | 是   |
| `CACHE_DRIVER`   | 缓存驱动程序（详见[缓存驱动程序](#缓存驱动程序)）。 | 是   |
| `SESSION_DRIVER` |                              | 是   |
| `QUEUE_DRIVER`   |                              | 是   |
| `REDIS_HOST`     | Redis 数据库的主机名或IP地址            | 是   |
| `REDIS_PASSWORD` | 用于保护 redis 数据库的密码            | 可选  |
| `REDIS_PORT`     | Redis 数据库端口                | 可选  |
| `MAIL_DRIVER`    | 邮件驱动程序（详见 [邮件驱动程序](#邮件驱动程序)） | 是   |
| `MAIL_FROM`      | 发件邮箱                         | 是   |
| `MAIL_HOST`      | 邮件驱动主机                       | 可选  |
| `MAIL_PORT`      | 邮件驱动端口                       | 可选  |
| `MAIL_USERNAME`  | 邮件驱动用户名                     | 可选  |
| `MAIL_PASSWORD`  | 邮件驱动密码                       | 可选  |

### 缓存驱动程序
您可以根据自己的喜好选择不同的缓存驱动程序。
我们推荐在使用 docker 时使用 redis，因为它可以在容器中轻松启动。

| 驱动程序   | 描述                                 | 所需变量                                               |
| -------- | ------------------------------------ | ------------------------------------------------------ |
| redis    | redis 运行的主机          | `REDIS_HOST`                                           |
| redis    | redis 运行的端口             | `REDIS_PORT`                                           |
| redis    | redis 数据库密码              | `REDIS_PASSWORD`                                       |

### 邮件驱动程序
你可以根据你的需要选择不同的邮件驱动。
每个驱动程序都需要设置 `MAIL_FROM`。

| 驱动程序   | 描述                                 | 所需变量                                                       |
| -------- | ------------------------------------ | ------------------------------------------------------------- |
| mail     | 使用已安装的php邮件                   |                                                               |
| mandrill | [Mandrill](http://www.mandrill.com/) | `MAIL_USERNAME`                                               |
| postmark | [Postmark](https://postmarkapp.com/) | `MAIL_USERNAME`                                               |
| mailgun  | [Mailgun](https://www.mailgun.com/)  | `MAIL_USERNAME`, `MAIL_HOST`                                  |
| smtp     | 任何SMTP服务器都可以配置               | `MAIL_USERNAME`, `MAIL_HOST`, `MAIL_PASSWORD`, `MAIL_PORT`    |
