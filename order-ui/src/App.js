import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { makeStyles } from '@material-ui/core/styles';
import MenuIcon from '@material-ui/icons/Menu';
import {
  Grid, Stepper, Step, StepLabel, AppBar, Toolbar, Typography, IconButton, Container,
  Radio, RadioGroup, FormControlLabel, FormControl, FormHelperText, FormLabel, Button,
  CircularProgress
} from '@material-ui/core';
import { QontoStepIcon } from './StepIcon';

const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  button: {
    marginTop: 20
  }
}));

function getSteps() {
  return ['Order Received', 'Processing', 'Ready To Pickup', 'Delivery On Way', 'Delivered'];
}

export default function App() {
  const classes = useStyles();
  const [activeStep, setActiveStep] = useState(0);
  const [food, setFood] = useState('');
  const [drink, setDrink] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [status, setStatus] = useState(null);

  const steps = getSteps();

  function submitOrder() {
    setLoading(true);
    axios.post(`${baseUrl}/order`, {
      food, drink
    }).then((res) => {
      setOrderId(res.data.id);
    }).finally(() => setLoading(false));
  }

  useEffect(() => {
    if (orderId) {
      pollStatus(orderId);
    }
  }, [orderId]);

  useEffect(() => {
    if (status) {
      let activeIndex = 0;
      switch (status) {
        case 'OrderReceived':
          activeIndex = 0;
          break;
        case 'Processing':
          activeIndex = 1;
          break;
        case 'ReadyToPickup':
          activeIndex = 2;
          break;
        case 'DeliveryOnWay':
          activeIndex = 3;
          break;
        case 'Delivered':
          activeIndex = 4;
          break;
      }
      setActiveStep(activeIndex);
    }
  }, [status]);

  function pollStatus(id) {
    setTimeout(async () => {
      const status = await fetchStatus(id);
      setStatus(status);
      if (status !== 'Delivered') {
        pollStatus(id);
      }
    }, 500);
  }

  async function fetchStatus(id) {
    return axios.get(`${baseUrl}/order/${id}`)
      .then(res => res.data)
      .then(data => data.status)
      .catch((e) => console.error(e));
  }

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            Demo: Event Driven Apps with Dapr in Kubernetes
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm">
        <Grid container style={{ marginTop: 40 }}>
          <Grid item xs={6} spacing={3}>
            <FormControl component="fieldset" className={classes.formControl}>
              <FormLabel component="legend">Food</FormLabel>
              <RadioGroup aria-label="food" name="food" value={food}
                onChange={(e) => setFood(e.target.value)}>
                <FormControlLabel value="pizza" control={<Radio />} label="Pizza 🍕" />
                <FormControlLabel value="burger" control={<Radio />} label="Burger 🍔" />
                <FormControlLabel value="sandwich" control={<Radio />} label="Sandwich 🥪" />
                <FormControlLabel value="hotdog" control={<Radio />} label="HotDog 🌭" />
                <FormControlLabel value="fries" control={<Radio />} label="Fries 🍟" />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl component="fieldset" className={classes.formControl}>
              <FormLabel component="legend">Drink</FormLabel>
              <RadioGroup aria-label="drink" name="drink" value={drink}
                onChange={(e) => setDrink(e.target.value)}>
                <FormControlLabel value="drink1" control={<Radio />} label="Diet Coke" />
                <FormControlLabel value="drink2" control={<Radio />} label="Coke" />
                <FormControlLabel value="drink3" control={<Radio />} label="Coffee" />
                <FormControlLabel value="drink4" control={<Radio />} label="Iced Tea" />
                <FormControlLabel value="drink5" control={<Radio />} label="Beer" />
                <FormControlLabel value="drink6" control={<Radio />} label="Orange Juice" />
              </RadioGroup>
              <FormHelperText></FormHelperText>
            </FormControl>
          </Grid>
          <Button type="submit" variant="outlined" disabled={!(food && drink)}
            color="primary" className={classes.button}
            onClick={submitOrder}>
            {loading && <CircularProgress
              className={classes.spinner}
              size={20}
            />}
            Submit Order
          </Button>
        </Grid>
        {orderId && <Grid container style={{ marginTop: 50 }}>
          <Grid item>
            <Typography variant="h6" className={classes.title}>
              Order ID: {orderId}
            </Typography>
          </Grid>
          <Grid item>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel StepIconComponent={QontoStepIcon}>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Grid>
        </Grid>
        }
      </Container>
    </div >
  );
}
