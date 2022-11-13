const hre = require('hardhat')
const { utils } = require('ethers')
const fs = require('fs')
const R = require('ramda')
// const { network, contractName } = require('../constants');
const networks = require('../utils/networks.json')

const network = 'mainnet'
const contractName = 'Samudai'

const abiEncodeArgs = (deployed, contractArgs) => {
  if (
    !contractArgs ||
    !deployed ||
    !R.hasPath(['interface', 'deploy'], deployed)
  )
    return ''
  const encoded = utils.defaultAbiCoder.encode(
    deployed.interface.deploy.inputs,
    contractArgs
  )
  return encoded
}

const deploy = async (
  contractName,
  _args = [],
  overrides = {},
  libraries = {}
) => {
  console.log(' 📡  Deploying ', `${contractName}`, 'to', `${network}...\n`)

  fs.mkdir('src/abis', { recursive: true }, (err) => {
    if (err) throw err
  })

  const contractArgs = _args || []
  const contractArtifacts = await hre.ethers.getContractFactory(contractName, {
    libraries: libraries,
  })
  const deployed = await contractArtifacts.deploy(...contractArgs, overrides)
  const contractArtifact = await hre.artifacts.readArtifact(contractName)
  const encoded = abiEncodeArgs(deployed, contractArgs)

  fs.writeFileSync(`artifacts/${contractName}.address`, deployed.address)

  const abiData = {
    abi: contractArtifact.abi,
  }
  fs.writeFileSync(`./utils/abis/${contractName}.json`, JSON.stringify(abiData))

  let extraGasInfo = ''

  if (deployed && deployed.deployTransaction) {
    const gasUsed = deployed.deployTransaction.gasLimit.mul(
      deployed.deployTransaction.gasPrice
    )

    extraGasInfo = `${utils.formatEther(gasUsed)} ETH, tx hash ${
      deployed.deployTransaction.hash
    }`
  }

  console.log(' 📄', contractName, 'deployed at:', deployed.address)
  console.log(' ⛽', extraGasInfo, '\n')

  // if (network !== 'localhost') {
  //   networks[`${network}`].addresses.AutoAppealableArbitrator = String(arbitratorAddress);
  // }
  networks[`${network}`].addresses[`${contractName}`] = String(deployed.address)

  fs.writeFileSync(
    './utils/networks.json',
    JSON.stringify(networks, null, 2),
    function writeJSON(err) {
      if (err) return console.log(err)
    }
  )

  if (network !== 'localhost' && network !== 'hardhat') {
    if (network === 'polygontestnet') {
      console.log(' 🚀 View contract on polygonscan: ')
    } else {
      console.log(' 🚀 View contract on etherscan: ')
    }
    console.log(
      '   ',
      `${hre.config.networks[network].blockExplorer}/address/${deployed.address}`
    )
  }

  if (!encoded || encoded.length <= 2) return deployed

  fs.writeFileSync(`artifacts/${contractName}.args`, encoded.slice(2))

  return deployed
}

async function main() {
  await deploy(contractName)

  console.log(
    ' \n 💾  Artifacts (address, abi, and args) saved to: ',
    './artifacts',
    '\n'
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
