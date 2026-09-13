export class IdempotencyStore {
  constructor(private readonly db: D1Database) {}

  async claimDelivery(deliveryId: string): Promise<boolean> {
    const result = await this.db
      .prepare("INSERT OR IGNORE INTO webhook_deliveries (delivery_id) VALUES (?)")
      .bind(deliveryId)
      .run();
    return result.meta.changes === 1;
  }

  async claimAction(actionKey: string): Promise<boolean> {
    const result = await this.db
      .prepare("INSERT OR IGNORE INTO action_keys (action_key) VALUES (?)")
      .bind(actionKey)
      .run();
    return result.meta.changes === 1;
  }

  async releaseAction(actionKey: string): Promise<void> {
    await this.db.prepare("DELETE FROM action_keys WHERE action_key = ?").bind(actionKey).run();
  }
}
