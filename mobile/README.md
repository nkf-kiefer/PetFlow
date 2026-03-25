# PetFlow Mobile

App React Native (Expo) para o sistema de gestão veterinária PetFlow.

## Stack

- **React Native** com Expo SDK 52
- **React Navigation** v6 (Stack + Bottom Tabs)
- **Axios** com interceptor JWT automático
- **AsyncStorage** para persistência do token

## Pré-requisitos

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Android Studio (para emulador Android) ou Xcode (para iOS)
- ou o app **Expo Go** no celular

## Instalação

```bash
cd mobile
npm install
```

## Rodando

```bash
# Abre o menu Expo (QR code para Expo Go no celular)
npm start

# Apenas Android
npm run android

# Apenas iOS (macOS)
npm run ios
```

## Estrutura

```
mobile/
├── App.js                          # Entry point + NavigationContainer
├── app.json                        # Configuração Expo
├── package.json
├── src/
│   ├── api/
│   │   ├── client.js               # Axios + interceptor JWT refresh
│   │   └── resources.js            # CRUD de todos os recursos da API
│   ├── context/
│   │   └── AuthContext.js          # Login, logout, token persistido
│   ├── navigation/
│   │   └── AppTabs.js              # Bottom tabs + stacks por módulo
│   ├── components/
│   │   ├── AppButton.js            # Botão primário / danger / ghost
│   │   ├── AppInput.js             # TextInput com label e erro
│   │   ├── AppPicker.js            # Picker modal customizado
│   │   ├── ListItemCard.js         # Card clicável para listas
│   │   └── EmptyState.js           # Estado vazio das listas
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js      # Cards de resumo
│   │   ├── MoreScreen.js           # Menu de módulos
│   │   ├── clinics/
│   │   ├── tutors/
│   │   ├── pets/
│   │   ├── employees/
│   │   ├── services/
│   │   ├── products/
│   │   ├── schedulings/
│   │   ├── stock/
│   │   └── financial/
│   └── theme/
│       └── index.js                # Cores, espaçamento, tipografia
```

## Navegação

```
Bottom Tabs
├── Início     → Dashboard (cards de resumo + logout)
├── Agenda     → Agendamentos (lista + form CRUD)
├── Pets/Tutores → Tutores + Pets (lista + form CRUD)
└── Mais       → Menu
                 ├── Clínicas
                 ├── Funcionários
                 ├── Serviços
                 ├── Produtos
                 ├── Estoque (movimentações)
                 └── Financeiro (receitas e despesas)
```

## Gerar APK (Android)

```bash
# Instale o EAS CLI
npm install -g eas-cli

# Login na conta Expo
eas login

# Build APK para teste
eas build -p android --profile preview
```

## API

O app consome a API em produção:  
`https://Nataliakiefer.pythonanywhere.com/api`

Para apontar para ambiente local, altere `API_BASE` em `src/api/client.js`.
