type ErrorResponseBody = { message: string };

export const response = <T extends object>({ statusCode, body }: { statusCode: number, body: T | ErrorResponseBody }) => ({
    statusCode,
    headers: {
        'Access-Control-Allow-Origin': '*', // credentials: trueならOriginを指定するべき
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body),
});
