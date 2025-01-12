/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 */

import { InvalidResourceError, Validator } from 'fhir-works-on-aws-interface';
import { validateResource } from './validationUtilities';

describe('validateResource', () => {
    const mockedSuccessValidator: Validator = {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        validate(resource: any) {
            return Promise.resolve();
        },
    };
    const mockedFailedValidatorA: Validator = {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async validate(resource: any) {
            // Sleep for one second, so if validatorA and validatorB are in validators array we can ensure validatorA
            // takes longer to run than validator B. This is helpful for testing that the validators are run sequentially
            await new Promise((r) => setTimeout(r, 10));
            throw new InvalidResourceError('Failed validation from validator A');
        },
    };
    const mockedFailedValidatorB: Validator = {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        validate(resource: any) {
            throw new InvalidResourceError('Failed validation from validator B');
        },
    };
    test('All validators passes', async () => {
        await expect(validateResource([mockedSuccessValidator, mockedSuccessValidator], {})).resolves.toEqual(
            undefined,
        );
    });
    test('One validator fails', async () => {
        await expect(validateResource([mockedSuccessValidator, mockedFailedValidatorB], {})).rejects.toThrowError(
            new InvalidResourceError('Failed validation from validator B'),
        );
    });
    test('Validator fails in order', async () => {
        await expect(
            validateResource([mockedSuccessValidator, mockedFailedValidatorA, mockedFailedValidatorB], {}),
        ).rejects.toThrowError(new InvalidResourceError('Failed validation from validator A'));
    });
});
