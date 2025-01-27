# AWS Thumbnail Architecture Workshop

Bienvenido al workshop de AWS CDK con TypeScript. En este repositorio encontrarás todo lo necesario para desplegar una arquitectura de procesamiento de imágenes en AWS, que incluye un bucket S3, una cola SQS y una Lambda para generar thumbnails.

## Requisitos previos

Antes de comenzar, asegúrate de tener los siguientes requisitos instalados y configurados en tu sistema:

1. **Node.js** (versión 18 o superior): [Descargar Node.js](https://nodejs.org/)
2. **npm** (incluido con Node.js)
3. **AWS CLI** (versión 2 o superior): [Instalar AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
4. **AWS CDK CLI**: Instala la CLI de CDK globalmente ejecutando:
   ```bash
   npm install -g aws-cdk
   ```

## Pasos para comenzar

1. Clonar el repositorio

```
  git clone https://github.com/antonio-marquez-perez/aws-thumbnail-arquitecture.git
  cd aws-thumbnail-arquitecture
```

2. Instalar las dependencias

```
  npm install
```

3. Autenticarse en AWS

Antes de desplegar la infraestructura, necesitas autenticarte en AWS. Dependiendo de tu configuración, elige una de las siguientes opciones:

- **Opción A: Autenticación con AWS SSO**

1. Configura tu perfil con AWS SSO si aún no lo has hecho:

```
  aws configure sso
```

2. Inicia sesión con el comando:

```
  aws sso login
```

- **Opcion B: Autenticación con credenciales de usuario**

1. Configura las credenciales de tu usuario con el siguiente comando:

```
  aws configure
```

2. Ingresa los siguientes datos:

- Access Key ID: La clave de acceso de tu usuario.
- Secret Access Key: La clave secreta de tu usuario.
- Region: La región en la que deseas desplegar los recursos (por ejemplo, us-east-1).
- Output format: Puedes usar json, table o text.

## Comandos utiles

- `npm run build` compila typescript a js
- `npm run watch` "watch" los cambios y los compila cuando guardamos un archivo
- `npm run test` ejecuta los test unitarios
- `npx cdk deploy` despliega los recurso en aws
- `npx cdk diff` compara lo que está despliegado con los nuevos cambios antes de desplegar
- `npx cdk synth` crea la plantilla de Cloudformation
