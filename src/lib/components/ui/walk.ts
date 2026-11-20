export type WalkStepState = 'todo' | 'done' | 'current';

export type WalkStep = {
	label: string;
	state?: WalkStepState;
};
