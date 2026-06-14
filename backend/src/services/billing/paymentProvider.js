export class PaymentProvider {
  /**
   * Creates a subscription for a business on a specific plan.
   * @param {Object} business - Business DB object
   * @param {Object} plan - Plan DB object
   * @param {string} interval - 'month' | 'year'
   * @param {string} email - Payer email
   * @returns {Promise<{ providerSubId: string, checkoutUrl: string }>}
   */
  async createSubscription(business, plan, interval, email) {
    throw new Error("createSubscription not implemented");
  }

  /**
   * Cancels a subscription.
   * @param {string} providerSubId - Provider subscription ID
   * @returns {Promise<boolean>}
   */
  async cancelSubscription(providerSubId) {
    throw new Error("cancelSubscription not implemented");
  }

  /**
   * Verifies the authenticity of a webhook request.
   * @param {Object} req - Express Request
   * @returns {Promise<boolean>}
   */
  async verifyWebhook(req) {
    throw new Error("verifyWebhook not implemented");
  }

  /**
   * Parses the webhook payload into a normalized system event.
   * @param {Object} payload - Webhook payload object
   * @param {Object} [headers] - Optional headers for verification
   * @returns {Promise<{ eventId: string, type: string, providerSubId: string, status: string, amount: number, raw: Object }>}
   */
  async parseEvent(payload, headers) {
    throw new Error("parseEvent not implemented");
  }
}
