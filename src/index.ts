import yargs from 'yargs';
import fs from 'promise-fs';
import path from 'path';
import SSM from 'aws-sdk/clients/ssm';

// main is main function which is started by the runner during
// step execution.
async function main(args: any) {
  const env = process.env
  const workspace = env.NEX_WORKSPACE
  if (!workspace || workspace === "") {
    console.log("workspace was not set")
    process.exit(1)
  }
  const ssm: SSM = new SSM({ region: 'eu-west-1' })
  const decrypt = ['TOKEN']

  const secrets = await decrypt.reduce(async (memo, name: string) => {
    try {
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
    } catch (err) {
      console.log("error: cannot decrypt %s: %s", name, err)
      process.exit(1)
    }
  }, {})
  try {
    const filepath = path.resolve(workspace + '/../.secrets/secrets.json')
    // Create directory.
    await fs.mkdir(path.dirname(filepath))
    // Add some output.
    console.log('writing secrets to %s', filepath)
    // Write secrets to json file.
    await fs.writeFile(filepath, JSON.stringify(secrets))
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

// start main
main(yargs(process.argv).argv)