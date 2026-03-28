# PetFlow Mobile

Aplicativo mobile do PetFlow feito com React Native + Expo.

A ideia aqui foi levar as mesmas rotinas do sistema web para o celular, mantendo a API Django como backend único.

## O que já está implementado

- autenticação com JWT
- dashboard inicial
- CRUD de clínicas, tutores, pets, funcionários, serviços e produtos
- agendamentos com validações básicas e filtros por clínica
- estoque (movimentações)
- financeiro (registros de receita/despesa)

## Stack usada

- React Native com Expo
- React Navigation (tabs + stacks)
- Axios para chamadas da API
- AsyncStorage para persistência de sessão

## Requisitos

- Node.js 18+
- npm
- Expo Go no celular ou emulador Android/iOS

## Como rodar local

```bash
cd mobile
npm install
npm start
```

Depois do `npm start`, é só abrir no Expo Go (QR code) ou iniciar emulador.

Comandos úteis:

```bash
npm run android
npm run ios
```

## Estrutura do projeto

```text
mobile/
├─ App.js
├─ app.json
├─ babel.config.js
├─ package.json
└─ src/
    ├─ api/
    │  ├─ client.js
    │  └─ resources.js
    ├─ components/
    ├─ context/
    ├─ navigation/
    ├─ screens/
    │  ├─ clinics/
    │  ├─ tutors/
    │  ├─ pets/
    │  ├─ employees/
    │  ├─ services/
    │  ├─ products/
    │  ├─ schedulings/
    │  ├─ stock/
    │  └─ financial/
    ├─ theme/
    └─ utils/
```

## Navegação atual

- Início: resumo e atalhos
- Agenda: listagem e cadastro de agendamentos
- Tutores e Pets: gestão de cadastro
- Mais: acesso aos demais módulos administrativos

## API e ambiente

O app usa a variável `EXPO_PUBLIC_API_BASE` (quando definida).

Sem essa variável, o fallback é:

`http://127.0.0.1:8000/api`

Para apontar para outro host local/rede, rode com:

```bash
EXPO_PUBLIC_API_BASE=http://SEU_IP:8000/api npm start
```

## Build Android (APK)

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

## Observações de desenvolvimento

- este app está no mesmo repositório do backend por escolha de organização
- `node_modules` e `.expo` não devem ser versionados
- antes de commit, conferir sempre com `git status` e `git diff --staged`

## Próximos ajustes planejados

- melhorar experiência de agenda (regras de horário e conflitos)
- evoluir feedback de erro para cenários offline
- ampliar suporte a configuração de API por dispositivo/rede local
