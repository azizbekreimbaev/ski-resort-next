import { gql } from '@apollo/client';

const EVENT_FIELDS = gql`
	fragment EventFields on Event {
		_id
		eventTitle
		eventDesc
		eventImages
		eventStartDate
		eventEndDate
		eventStatus
		eventLocation
		resortId
		memberId
		createdAt
		updatedAt
	}
`;
export const GET_EVENTS = gql`
	query Events($input: EventsInquiry!) {
		getEvents(input: $input) {
			list {
				...EventFields
			}
			metaCounter {
				total
			}
		}
	}
	${EVENT_FIELDS}
`;
export const GET_ADMIN_EVENTS = gql`
	query AdminEvents($input: AllEventsInquiry!) {
		getAllEventsByAdmin(input: $input) {
			list {
				...EventFields
			}
			metaCounter {
				total
			}
		}
	}
	${EVENT_FIELDS}
`;
export const GET_EVENT = gql`
	query EventDetail($eventId: String!) {
		getEvent(eventId: $eventId) {
			...EventFields
		}
	}
	${EVENT_FIELDS}
`;
export const GET_ADMIN_EVENT = gql`
	query AdminEventDetail($eventId: String!) {
		getEventByAdmin(eventId: $eventId) {
			...EventFields
		}
	}
	${EVENT_FIELDS}
`;
export const CREATE_EVENT = gql`
	mutation CreateEvent($input: EventInput!) {
		createEvent(input: $input) {
			...EventFields
		}
	}
	${EVENT_FIELDS}
`;
export const UPDATE_EVENT = gql`
	mutation UpdateEvent($input: EventUpdate!) {
		updateEventByAdmin(input: $input) {
			...EventFields
		}
	}
	${EVENT_FIELDS}
`;
export const REMOVE_EVENT = gql`
	mutation RemoveEvent($eventId: String!) {
		removeEventByAdmin(eventId: $eventId) {
			_id
		}
	}
`;
export const UPLOAD_EVENT_IMAGES = gql`
	mutation UploadEventImages($files: [Upload!]!) {
		uploadEventImages(files: $files)
	}
`;
