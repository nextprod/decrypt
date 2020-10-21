import yargs from 'yargs';
import fs from 'promise-fs'
import SSM from 'aws-sdk/clients/ssm';
// main is main function which is started by the runner during
// step execution.
async function main(args: any) {
  const ssm: SSM = new SSM({ region: 'eu-west-1' });
  const options = {
    Name: '/builds/secrets/token', /* required */
    WithDecryption: true
  }
  try {
    const data = await ssm.getParameter(options).promise()
    const secrets: any = {}
    secrets.TOKEN = data.Parameter?.Value
    await fs.writeFile("./secrets.json", JSON.stringify(secrets))
  } catch {
    console.log("error: unable to decrypt parameter")
    process.exit(1)
  }
}
// start main
main(yargs(process.argv).argv)