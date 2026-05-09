import {
  type CanvasEdgeData,
  type CanvasNodeData,
  type CanvasNodeShape,
  type canvasEdge,
  type canvasNode,
  NODE_COLORS,
} from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: canvasNode[];
  edges: canvasEdge[];
}

interface TemplateNodeInput {
  id: string;
  label: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  shape?: CanvasNodeShape;
  colorIndex?: number;
}

interface TemplateEdgeInput {
  id: string;
  source: string;
  target: string;
  label?: string;
}

const DEFAULT_NODE_WIDTH = 150;
const DEFAULT_NODE_HEIGHT = 72;

function templateNode({
  id,
  label,
  x,
  y,
  width = DEFAULT_NODE_WIDTH,
  height = DEFAULT_NODE_HEIGHT,
  shape = "rectangle",
  colorIndex = 0,
}: TemplateNodeInput): canvasNode {
  const color = NODE_COLORS[colorIndex] ?? NODE_COLORS[0];

  return {
    id,
    type: "custom",
    position: { x, y },
    data: {
      label,
      color: color.fill,
      textColor: color.text,
      shape,
    } satisfies CanvasNodeData,
    style: {
      height,
      width,
    },
  };
}

function templateEdge({ id, source, target, label = "" }: TemplateEdgeInput): canvasEdge {
  return {
    id,
    source,
    target,
    type: "canvas",
    data: {
      label,
    } satisfies CanvasEdgeData,
  };
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices-platform",
    name: "Microservices Platform",
    description:
      "API gateway, bounded services, shared observability, and separate operational stores.",
    nodes: [
      templateNode({
        id: "ms-client",
        label: "Web / Mobile Clients",
        x: 0,
        y: 120,
        shape: "hexagon",
        colorIndex: 7,
      }),
      templateNode({
        id: "ms-gateway",
        label: "API Gateway",
        x: 230,
        y: 120,
        shape: "pill",
        colorIndex: 1,
      }),
      templateNode({
        id: "ms-auth",
        label: "Auth Service",
        x: 460,
        y: 0,
        shape: "pill",
        colorIndex: 2,
      }),
      templateNode({
        id: "ms-orders",
        label: "Orders Service",
        x: 460,
        y: 120,
        shape: "pill",
        colorIndex: 3,
      }),
      templateNode({
        id: "ms-billing",
        label: "Billing Service",
        x: 460,
        y: 240,
        shape: "pill",
        colorIndex: 5,
      }),
      templateNode({
        id: "ms-events",
        label: "Event Bus",
        x: 700,
        y: 120,
        shape: "diamond",
        colorIndex: 6,
      }),
      templateNode({
        id: "ms-database",
        label: "Service Databases",
        x: 700,
        y: 260,
        shape: "cylinder",
        colorIndex: 4,
      }),
    ],
    edges: [
      templateEdge({ id: "ms-client-gateway", source: "ms-client", target: "ms-gateway" }),
      templateEdge({ id: "ms-gateway-auth", source: "ms-gateway", target: "ms-auth" }),
      templateEdge({ id: "ms-gateway-orders", source: "ms-gateway", target: "ms-orders" }),
      templateEdge({ id: "ms-gateway-billing", source: "ms-gateway", target: "ms-billing" }),
      templateEdge({ id: "ms-orders-events", source: "ms-orders", target: "ms-events" }),
      templateEdge({ id: "ms-billing-events", source: "ms-billing", target: "ms-events" }),
      templateEdge({ id: "ms-services-db", source: "ms-events", target: "ms-database" }),
    ],
  },
  {
    id: "ci-cd-pipeline",
    name: "CI/CD Pipeline",
    description:
      "Source changes flow through build, test, artifact, deployment, and runtime monitoring.",
    nodes: [
      templateNode({
        id: "cicd-repo",
        label: "Source Repo",
        x: 0,
        y: 110,
        shape: "hexagon",
        colorIndex: 2,
      }),
      templateNode({
        id: "cicd-build",
        label: "Build Job",
        x: 220,
        y: 110,
        shape: "rectangle",
        colorIndex: 1,
      }),
      templateNode({
        id: "cicd-tests",
        label: "Test Suite",
        x: 440,
        y: 110,
        shape: "diamond",
        colorIndex: 3,
      }),
      templateNode({
        id: "cicd-artifact",
        label: "Artifact Registry",
        x: 660,
        y: 0,
        shape: "cylinder",
        colorIndex: 7,
      }),
      templateNode({
        id: "cicd-deploy",
        label: "Deploy Workflow",
        x: 660,
        y: 220,
        shape: "pill",
        colorIndex: 6,
      }),
      templateNode({
        id: "cicd-runtime",
        label: "Production Runtime",
        x: 900,
        y: 110,
        shape: "hexagon",
        colorIndex: 4,
      }),
      templateNode({
        id: "cicd-monitoring",
        label: "Monitoring",
        x: 1120,
        y: 110,
        shape: "circle",
        colorIndex: 5,
      }),
    ],
    edges: [
      templateEdge({ id: "cicd-repo-build", source: "cicd-repo", target: "cicd-build" }),
      templateEdge({ id: "cicd-build-tests", source: "cicd-build", target: "cicd-tests" }),
      templateEdge({ id: "cicd-tests-artifact", source: "cicd-tests", target: "cicd-artifact" }),
      templateEdge({ id: "cicd-tests-deploy", source: "cicd-tests", target: "cicd-deploy" }),
      templateEdge({ id: "cicd-artifact-deploy", source: "cicd-artifact", target: "cicd-deploy" }),
      templateEdge({ id: "cicd-deploy-runtime", source: "cicd-deploy", target: "cicd-runtime" }),
      templateEdge({
        id: "cicd-runtime-monitoring",
        source: "cicd-runtime",
        target: "cicd-monitoring",
      }),
    ],
  },
  {
    id: "event-driven-commerce",
    name: "Event-Driven Commerce",
    description:
      "Checkout events fan out to fulfillment, billing, notification, projection, and analytics consumers.",
    nodes: [
      templateNode({
        id: "ed-api",
        label: "Checkout API",
        x: 0,
        y: 130,
        shape: "pill",
        colorIndex: 1,
      }),
      templateNode({
        id: "ed-orders",
        label: "Order Service",
        x: 230,
        y: 130,
        shape: "rectangle",
        colorIndex: 3,
      }),
      templateNode({
        id: "ed-bus",
        label: "Event Stream",
        x: 460,
        y: 130,
        shape: "diamond",
        colorIndex: 7,
      }),
      templateNode({
        id: "ed-fulfillment",
        label: "Fulfillment",
        x: 700,
        y: 0,
        shape: "pill",
        colorIndex: 6,
      }),
      templateNode({
        id: "ed-payments",
        label: "Payments",
        x: 700,
        y: 130,
        shape: "pill",
        colorIndex: 5,
      }),
      templateNode({
        id: "ed-notifications",
        label: "Notifications",
        x: 700,
        y: 260,
        shape: "circle",
        colorIndex: 2,
      }),
      templateNode({
        id: "ed-read-model",
        label: "Read Model",
        x: 930,
        y: 70,
        shape: "cylinder",
        colorIndex: 4,
      }),
      templateNode({
        id: "ed-analytics",
        label: "Analytics",
        x: 930,
        y: 210,
        shape: "hexagon",
        colorIndex: 0,
      }),
    ],
    edges: [
      templateEdge({ id: "ed-api-orders", source: "ed-api", target: "ed-orders" }),
      templateEdge({ id: "ed-orders-bus", source: "ed-orders", target: "ed-bus" }),
      templateEdge({ id: "ed-bus-fulfillment", source: "ed-bus", target: "ed-fulfillment" }),
      templateEdge({ id: "ed-bus-payments", source: "ed-bus", target: "ed-payments" }),
      templateEdge({ id: "ed-bus-notifications", source: "ed-bus", target: "ed-notifications" }),
      templateEdge({ id: "ed-bus-read-model", source: "ed-bus", target: "ed-read-model" }),
      templateEdge({ id: "ed-bus-analytics", source: "ed-bus", target: "ed-analytics" }),
    ],
  },
];
