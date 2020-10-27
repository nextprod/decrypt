import fs from 'promise-fs';
import _path from 'path';
import SSM from 'aws-sdk/clients/ssm';

const outputDir = process.env.NEX_STEP_OUTPUT_DIR || __dirname;

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
  // Deconstruct parameters.
  const { region, decrypt, path } = event.parameters;
  // Setup ssm and prepare parameters.
  const ssm: SSM = new SSM({ region: region || 'eu-west-1' })
  const params = {
    decrypt,
    path: path || './secrets.json',
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
    const filepath = _path.resolve(_path.join(outputDir, params.path))
    console.log(filepath)
    // By default it's path to workspace
    const dir = _path.dirname(filepath)
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