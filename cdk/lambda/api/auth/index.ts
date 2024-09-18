import { APIGatewayProxyEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { response } from '../response';
import { CognitoIdentityProviderClient, AdminInitiateAuthCommand, NotAuthorizedException, TooManyRequestsException, UserNotFoundException } from '@aws-sdk/client-cognito-identity-provider';

export type AuthenticationResult = {
    idToken: string;
    refreshToken: string;
    expiresIn: number;
};

const cognitoClient = new CognitoIdentityProviderClient({});
const userPoolId = process.env.COGNITO_USER_POOL_ID!;
const clinetId = process.env.COGNITO_CLIENT_ID!;

export const handler = withErrorHandler(async (event) => {
	const { username, password } = JSON.parse(event.body || '{}');

	const result = await cognitoClient.send(new AdminInitiateAuthCommand({
		UserPoolId: userPoolId,
		ClientId: clinetId,
		AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
		AuthParameters: {
			USERNAME: username,
			PASSWORD: password,
		},
	}));

	return response<AuthenticationResult>({
		statusCode: 200,
		body: { 
			idToken: result.AuthenticationResult?.IdToken!,
			refreshToken: result.AuthenticationResult?.RefreshToken!,
			expiresIn: result.AuthenticationResult?.ExpiresIn!,
		},
	});
});

export const refreshHandler = withErrorHandler(async (event) => {
    const { refreshToken } = JSON.parse(event.body || '{}');

	const result = await cognitoClient.send(new AdminInitiateAuthCommand({
		UserPoolId: userPoolId,
		ClientId: clinetId,
		AuthFlow: 'REFRESH_TOKEN_AUTH',
		AuthParameters: {
			REFRESH_TOKEN: refreshToken,
		},
	}));

	return response<AuthenticationResult>({
		statusCode: 200,
		body: { 
			idToken: result.AuthenticationResult?.IdToken!,
			refreshToken: result.AuthenticationResult?.RefreshToken ?? refreshToken,
			expiresIn: result.AuthenticationResult?.ExpiresIn!,
		},
	});
});

function withErrorHandler(operation: (event: APIGatewayProxyEvent) => Promise<any>): APIGatewayProxyHandler {
	return async (event, _context) => {
		try {
			return await operation(event);
		} catch (error) {
			if (error instanceof NotAuthorizedException || error instanceof UserNotFoundException) {
				return response({
					statusCode: 401,
					body: { message: 'Failed to authenticate.' },
				});
			}
			if (error instanceof TooManyRequestsException) {
				return response({
					statusCode: 429,
					body: { message: 'Too many requests.' },
				});
			}
	
			return response({
				statusCode: 500,
				body: { message: 'Something went wrong.' },
			});
		}
	}
}
