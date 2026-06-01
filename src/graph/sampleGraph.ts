import type { AwilixifyGraph } from "./graph.types";

export const sampleGraph: AwilixifyGraph = {
  source: "awilixify/examples/fastify-cqrs",
  modules: [
    {
      id: "app",
      name: "AppModule",
      providers: ["ConfigService", "LoggerService"],
    },
    {
      id: "orders",
      name: "OrdersModule",
      providers: ["OrdersService", "CreateOrderHandler"],
    },
    {
      id: "users",
      name: "UsersModule",
      providers: ["UsersService", "FindUserHandler"],
    },
  ],
  edges: [
    { from: "app", to: "orders", type: "imports" },
    { from: "orders", to: "users", type: "depends-on" },
  ],
};
