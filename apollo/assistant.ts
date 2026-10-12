import { gql } from '@apollo/client';

export const ASK_ASSISTANT = gql`
	mutation AskAssistant($input: AssistantInput!) {
		askAssistant(input: $input) {
			answer
			sources {
				type
				id
				title
			}
		}
	}
`;
