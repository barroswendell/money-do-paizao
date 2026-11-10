# Money do Paizão

Projeto de organização das finanças familiares e controle de empréstimos.

## Estrutura

- `Api`: solução .NET 10 com DDD em camadas, EF Core e PostgreSQL.
- `Frontend/MoneyDoPaizao.Mobile`: aplicativo React Native com Expo.

## Banco de dados

Com o Docker instalado, suba o PostgreSQL na raiz do projeto:

```bash
docker compose up -d
```

A API usa a conexão local configurada em `Api/src/MoneyDoPaizao.Api/appsettings.json`. Ao iniciar, ela cria a estrutura inicial do banco e faz o seed do administrador de desenvolvimento.

## Administrador de desenvolvimento

- E-mail: `admin@moneydopaizao.local`
- Senha: `Admin@123`

Altere esses valores antes de qualquer ambiente compartilhado ou de produção.

## API

```bash
dotnet run --project Api/src/MoneyDoPaizao.Api
```

Endpoints iniciais:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /health`

## Aplicativo

Dentro de `Frontend/MoneyDoPaizao.Mobile`:

```bash
npm install
npm start
```

Por padrão, o app usa `http://10.0.2.2:5000/api`, endereço da API visto pelo emulador Android. Para outro ambiente, defina `EXPO_PUBLIC_API_URL` antes de iniciar o Expo.
