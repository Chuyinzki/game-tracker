import amqp from "amqplib";
import type { FastifyInstance } from "fastify";
import { RABBITMQ_EXCHANGE, RABBITMQ_QUEUE, summarizeEvent, type BacklogEvent, type StoredEvent } from "./events.js";

async function connectWithRetry(url: string, attempts = 10, delayMs = 1000) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await amqp.connect(url);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unable to connect to RabbitMQ.");
}

declare module "fastify" {
  interface FastifyInstance {
    recentEvents: StoredEvent[];
  }
}

function parseEvent(body: Buffer): BacklogEvent {
  return JSON.parse(body.toString("utf8")) as BacklogEvent;
}

export async function startEventConsumer(app: FastifyInstance, url: string) {
  const connection = await connectWithRetry(url);
  const channel = await connection.createChannel();

  await channel.assertExchange(RABBITMQ_EXCHANGE, "topic", {
    durable: true
  });
  await channel.assertQueue(RABBITMQ_QUEUE, {
    durable: true
  });
  await channel.bindQueue(RABBITMQ_QUEUE, RABBITMQ_EXCHANGE, "backlog.item.*");

  await channel.consume(RABBITMQ_QUEUE, async (message) => {
    if (!message) {
      return;
    }

    try {
      const event = parseEvent(message.content);
      const summary = summarizeEvent(event);

      app.recentEvents.unshift(summary);
      app.recentEvents = app.recentEvents.slice(0, 25);

      app.log.info({
        eventId: summary.eventId,
        type: summary.type,
        gameName: summary.gameName,
        userId: summary.userId
      }, "consumed backlog event");

      channel.ack(message);
    } catch (error) {
      app.log.error(error, "failed to process backlog event");
      channel.ack(message);
    }
  }, {
    noAck: false
  });

  app.addHook("onClose", async () => {
    await channel.close();
    await connection.close();
  });
}
