import fs from 'promise-fs';
import path from 'path';
import SSM from 'aws-sdk/clients/ssm';

// Event represents extension event.
type Event = {
  parameters: {
    region: string,
    decrypt: Array<string>,
    path: string,
  }
}

// main is main function which is started by the runner during
// step execution.
export async function run(event: Event) {
  const env = process.env
  const parameters = event.parameters;
  const workspace = env.NEX_WORKSPACE
  if (!workspace || workspace === "") {
    return new Error("workspace was not set")
  }
  const ssm: SSM = new SSM({ region: parameters.region || 'eu-west-1' })
  const params = {
    decrypt: event.parameters.decrypt,
    path: event.parameters.path || './secrets.json',
  }
  try {
    const secrets = await params.decrypt.reduce(async (memo, name: string) => {
      const secretPath = process.env[name]
      if (!secretPath) {
        throw new Error("env variable not found")
      }
      const options = {
        Name: secretPath,
        WithDecryption: true
      }
      const data = await ssm.getParameter(options).promise()
      // Set secret.
      return { ...(await memo), [name]: data.Parameter?.Value }
    }, {})
    const filepath = path.resolve(path.join(workspace, params.path))
    // By default it's path to workspace
    const dir = path.dirname(filepath)
    if (!fs.existsSync(dir)) {
      // Create directory.
      await fs.mkdir(dir)
    }
    // Add some output.
    console.log('writing secrets to %s', filepath)
    // Write secrets to json file.
    await fs.writeFile(filepath, JSON.stringify(secrets))
  } catch (err) {
    return err
  }
}