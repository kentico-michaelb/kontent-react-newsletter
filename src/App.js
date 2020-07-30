import React, { useState, useEffect } from 'react';
import moment from 'moment';
import './App.css';
import { client } from './config';


function Scheduling(props) {
  return (
    <div className="Scheduling-col">
      <div className="main-header">Scheduling</div>
      <NightShift nightShift={props.nightShift}/>
      <Vacations usOutOfOffice={props.usOutOfOffice} czOutOfOffice={props.czOutOfOffice}/> 
    </div>
  )
}

/* TODO: figure out inline content item resolution*/
function Today(props) { 
  return (
<div className="Today-col">
  <div className="main-header">For Today</div>
    <span dangerouslySetInnerHTML={{__html: props.todaysNews.today_info.resolveHtml()}}></span>

    <Meetings meetings={props.todaysNews.today_scheduled_events.value}/>

    <div className="section-header">Queue Owner</div>
      <ul>
        <li>{props.todaysNews.queue_owner.value[0].full_name.value}</li>
      </ul>

    <div className="section-header">Spam Duty</div>
    <ul>
      <li>
        {props.todaysNews.spam_duty.value[0].full_name.value}
      </li>
    </ul>

    <PD pd={props.todaysNews.personal_development.value}/>

  </div>
  );
}

function Upcoming() {
  const [events, setEvents] = useState();
  const [isLoading, setLoading] = useState(true);

  const today = moment().format('YYYY-MM-DD')
  const rangeMax = moment().add(7, 'days').format('YYYY-MM-DD');

  const fetchEvents = () => {
    return client
      .items()
      .type('scheduled_event')
      .rangeFilter('elements.start_time', today, rangeMax)
      .orderByAscending('elements.start_time')
      .toObservable()
      .subscribe(response => {
        setEvents(response.items);
        setLoading(false);
      });
  }

  useEffect (() =>{
    fetchEvents();
   },[]);

  if(isLoading === true) {
    return (
      <div>Loading...</div>
    );
  }
  else {
    let eventList = events.map((event, index) => {
      const day = moment.utc(event.start_time.value).format('dddd, MMMM Do YYYY');
      const start = moment.utc(event.start_time.value).format('LT');
      const end = moment.utc(event.end_time.value).format('LT');
      return <li key={index}>
        <h4>{day}</h4>
        {start} - {end} : {event.title.value}</li>;
    })

    return (
      <div className="Upcoming-col">
        <div className="main-header">Future Meetings</div>
        <ul>{eventList}</ul>
      </div>    
    )
  }
}

/* ----------END main sections---------- */
/* TODO: create ".map" helper function for DRY principles */
/*TODO: Extract into separate component files*/
function Meetings(props) {
  let meetings = props.meetings.map((meeting, index) => {
    const start = moment.utc(meeting.start_time.value).format('LT');
    const end = moment.utc(meeting.end_time.value).format('LT');
    return ( 
      <li key={index}>
        <b>{start} - {end}</b> : {meeting.title.value}
      </li>
    )
  });

  return ( 
    <div>
      <div className="section-header">Meetings</div>
      <ul>
        {meetings}
      </ul>
    </div>
  );
}

function NightShift(props){
  let nightShiftNames = props.nightShift.map((name, index) => {
    return (
      <li key={index}>
        {name.full_name.value}
      {index === 0 ? " (3-11)" : " (1-9)"}
      </li>
    );
  })

  return(
    <div>
      <div className="section-header">Tonight's Night Shift</div>
      <ul>{nightShiftNames}</ul>
    </div>
  );
}

/* TODO: link to Google Calendar | Outlook for auto-fill values*/
function Vacations(props) {
  let usNames = props.usOutOfOffice.map((name, index) => {
    return <li key={index}>{name.full_name.value}</li>;
  })
  let czNames = props.czOutOfOffice.map((name, index) => {
    return <li key={index}>{name.full_name.value}</li>;
  })

  return (
    <div>
      <div className="section-header">US Vacations</div>
      <ul>{usNames}</ul>
      <div className="section-header">CZ Vacations</div>
      <ul>{czNames}</ul>
    </div>
  );
}

function PD(props) {
  let names = props.pd.map((name, index) => {
    return <li key={index}>{name.full_name.value}</li>;
  })
  return (
    <div>
      <div className="section-header">Personal Development</div>
      <ul>{names}</ul>
    </div>
  );
}


function App() {
  const [newsletter, setNewsletter] = useState();
  const [usVacations, setUsVacations] = useState();
  const [czVacations, setCzVacations] = useState();
  const [nightShift, setNightShift] = useState();
  const [isLoading, setLoading] = useState(true);

  // get current date and format for Kontent date element
  let day = moment().utcOffset(0);
  day.set({hour:0,minute:0,second:0,millisecond:0});
  day = day.format();

  const fetchNewsletter = () => {
    return client
      .items()
      .type('newsletter')
      .equalsFilter('elements.date', day)
      .depthParameter(3)
      .toObservable()
      .subscribe(response => {
        if(response.items[0] != null) {
          setNewsletter(response.items[0])
          setNightShift(response.items[0].night_shift.value)
          setUsVacations(response.items[0].us_out_of_office.value)
          setCzVacations(response.items[0].cz_out_of_office.value)/*split out when GC logic added */
          setLoading(false);
        }
      });
  }

  useEffect (() =>{
   fetchNewsletter();
  },[]);

  if(isLoading === true) {
    return (
      <div className="App">
      <header className="App-header">
        No newsletter currently available
      <span>{moment.utc().format("dddd, MMMM Do YYYY")}</span>
      </header>
    </div>
    );
  }
  else {
    return (
      <div className="App">
        <header className="App-header">
          {newsletter.subject.value}
          <span>{moment.utc(newsletter.date.value).format("dddd, MMMM Do YYYY")}</span>
        </header>
        <div className="container">
          <Scheduling nightShift={nightShift} usOutOfOffice={usVacations} czOutOfOffice={czVacations}/>
          <Today todaysNews={newsletter}/> 
          <Upcoming />        
        </div>
      </div>
    );
  }
}

export default App;
