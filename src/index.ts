import yargs from 'yargs';
// main is main function which is started by the runner during
// step execution.
async function main(args: any) {
  console.log(process.env)
}
// start main
main(yargs(process.argv).argv)