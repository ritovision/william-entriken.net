import { test } from '@playwright/test';
import { formScenarios, runFormValidationThenSuccess } from './helpers/forms';

for (const scenario of formScenarios) {
  test(`mobile ${scenario.id} form rejects empty submit then accepts valid submit`, async ({
    page,
  }) => {
    await runFormValidationThenSuccess(page, scenario);
  });
}
