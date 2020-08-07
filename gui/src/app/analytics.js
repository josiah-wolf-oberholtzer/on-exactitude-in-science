import { createMiddleware } from 'redux-beacon';
import GoogleAnalytics, { trackPageView } from '@redux-beacon/google-analytics';
import logger from '@redux-beacon/logger';
import { LOCATION_CHANGE } from 'connected-react-router';

const ga = GoogleAnalytics(),
  pageView = trackPageView((action) => ({ page: action.payload.location.pathname })),
  eventsMap = { [LOCATION_CHANGE]: pageView },
  gaMiddleware = createMiddleware(eventsMap, ga, { logger });

export { gaMiddleware };
