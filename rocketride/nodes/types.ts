/**
 * Shared RocketRide pipeline node types.
 *
 * @sponsor RocketRide
 */

/** Generic input/output contract for all custom pipeline nodes. */
export interface PipelineNode<TInput = unknown, TOutput = unknown> {
  readonly id: string;
  readonly description: string;
  execute(input: TInput): Promise<TOutput>;
}
