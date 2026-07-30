import amqp from "amqplib";
import fp from "fastify-plugin";
import type { BacklogEvent } from "../lib/events.js";
import { RABBITMQ_EXCHANGE } from "../lib/events.js";

declare module "fastify" {
  interface FastifyInstance {
    rabbitmq: {
      publishBacklogEvent: (event: BacklogEvent) => Promise<void>;
    };
  }
}

type RabbitMQPluginOptions = {
  url: string;
};

export const rabbitmqPlugin = fp(async (app, options: RabbitMQPluginOptions) => {
  const connection = await amqp.connect(options.url);
  const channel = await connection.createConfirmChannel();

  await channel.assertExchange(RABBITMQ_EXCHANGE, "topic", {
    durable: true
  });

  app.decorate("rabbitmq", {
    publishBacklogEvent: async (event: BacklogEvent) => {
      const payload = Buffer.from(JSON.stringify(event), "utf8");
      channel.publish(RABBITMQ_EXCHANGE, event.type, payload, {
        contentType: "application/json",
        persistent: true
      });
      await channel.waitForConfirms();
    }
  });

  app.addHook("onClose", async () => {
    await channel.close();
    await connection.close();
  });
});
