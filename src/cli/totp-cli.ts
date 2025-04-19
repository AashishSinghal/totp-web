#!/usr/bin/env node

import { generateTOTP, verifyTOTP, getTOTPAuthUri, TOTPAlgorithm } from '../index';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'generate':
      await handleGenerate(args.slice(1));
      break;
    case 'verify':
      await handleVerify(args.slice(1));
      break;
    case 'uri':
      handleUri(args.slice(1));
      break;
    case 'help':
    default:
      printHelp();
      break;
  }
}

async function handleGenerate(args: string[]) {
  const options: Record<string, any> = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    if (key === 'algorithm') {
      options.algorithm = value.toUpperCase();
    } else if (key === 'digits') {
      options.digits = parseInt(value, 10);
    } else if (key === 'period') {
      options.period = parseInt(value, 10);
    } else if (key === 'charSet') {
      options.charSet = value;
    } else if (key === 'secret') {
      options.secret = value;
    }
  }

  try {
    const result = await generateTOTP(options);
    console.log('Generated TOTP:');
    console.log('Token:', result.token);
    console.log('Secret:', result.secret);
    console.log('Remaining seconds:', result.remainingSeconds);
  } catch (error) {
    console.error('Error generating TOTP:', error);
    process.exit(1);
  }
}

async function handleVerify(args: string[]) {
  const token = args[0];
  const secret = args[1];
  const options: {
    secret: string;
    algorithm?: TOTPAlgorithm;
    digits?: number;
    period?: number;
    charSet?: string;
    window?: number;
  } = { secret };
  
  for (let i = 2; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    if (key === 'algorithm') {
      options.algorithm = value.toUpperCase() as TOTPAlgorithm;
    } else if (key === 'digits') {
      options.digits = parseInt(value, 10);
    } else if (key === 'period') {
      options.period = parseInt(value, 10);
    } else if (key === 'charSet') {
      options.charSet = value;
    } else if (key === 'window') {
      options.window = parseInt(value, 10);
    }
  }

  try {
    const isValid = await verifyTOTP(token, options);
    console.log('Verification result:', isValid ? 'Valid' : 'Invalid');
  } catch (error) {
    console.error('Error verifying TOTP:', error);
    process.exit(1);
  }
}

function handleUri(args: string[]) {
  const options: {
    secret: string;
    accountName: string;
    issuer?: string;
    algorithm?: TOTPAlgorithm;
    digits?: number;
    period?: number;
  } = {
    secret: '',
    accountName: ''
  };
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    if (key === 'secret') {
      options.secret = value;
    } else if (key === 'accountName') {
      options.accountName = value;
    } else if (key === 'issuer') {
      options.issuer = value;
    } else if (key === 'algorithm') {
      options.algorithm = value.toUpperCase() as TOTPAlgorithm;
    } else if (key === 'digits') {
      options.digits = parseInt(value, 10);
    } else if (key === 'period') {
      options.period = parseInt(value, 10);
    }
  }

  if (!options.secret || !options.accountName) {
    console.error('Error: --secret and --accountName are required');
    process.exit(1);
  }

  try {
    const uri = getTOTPAuthUri(options);
    console.log('TOTP Auth URI:', uri);
  } catch (error) {
    console.error('Error generating URI:', error);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
TOTP Web CLI Tool

Usage:
  totp-web <command> [options]

Commands:
  generate    Generate a new TOTP token
  verify      Verify a TOTP token
  uri         Generate a TOTP auth URI
  help        Show this help message

Options for generate:
  --secret <secret>     Secret key (optional, will generate if not provided)
  --algorithm <algo>    Algorithm (SHA-1, SHA-256, SHA-512)
  --digits <number>     Number of digits (default: 6)
  --period <seconds>    Period in seconds (default: 30)
  --charSet <chars>     Custom character set

Options for verify:
  --secret <secret>     Secret key (required)
  --algorithm <algo>    Algorithm (SHA-1, SHA-256, SHA-512)
  --digits <number>     Number of digits (default: 6)
  --period <seconds>    Period in seconds (default: 30)
  --charSet <chars>     Custom character set
  --window <number>     Time window for verification (default: 1)

Options for uri:
  --secret <secret>     Secret key (required)
  --accountName <name>  Account name (required)
  --issuer <name>      Issuer name (optional)
  --algorithm <algo>    Algorithm (SHA-1, SHA-256, SHA-512)
  --digits <number>     Number of digits (default: 6)
  --period <seconds>    Period in seconds (default: 30)

Examples:
  totp-web generate
  totp-web generate --algorithm SHA-256 --digits 8
  totp-web verify ABC123 --secret JBSWY3DPEHPK3PXP
  totp-web uri --secret JBSWY3DPEHPK3PXP --accountName user@example.com --issuer Example
`);
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 