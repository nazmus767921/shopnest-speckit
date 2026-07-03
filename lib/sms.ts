/**
 * Mock SMS dispatch wrapper for development.
 * Actual integration with SSL Wireless happens in Unit 8.
 */
export async function sendSms(params: { to: string; message: string }): Promise<{ success: boolean }> {
  console.log("\n========================================");
  console.log(`[SMS SEND] To: ${params.to}`);
  console.log(`[SMS SEND] Message: ${params.message}`);
  console.log("========================================\n");
  return { success: true };
}
