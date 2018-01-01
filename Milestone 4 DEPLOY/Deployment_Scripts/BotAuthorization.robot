*** Settings ***
Documentation       WhatBot Authorization
Library             Selenium2Library
Library             String

*** Variables ***
${URL}               http://54.156.253.240:4500/login
${BROWSER}           chrome
${Flag}              false

*** Keywords ***
Go to EC2

    open browser  ${URL}    ${BROWSER}

*** Test Cases ***
Authorization
              Go to EC2
              input text  //*[@id="domain"]   parkwoodgang
              click button   //*[@id="submit_team_domain"]
              input text    //*[@id="email"]   whatbot.ncsu@gmail.com
              input text    //*[@id="password"]   <Appropraite Password>
              click button  //*[@id="signin_btn"]
              click button   //*[@id="oauth_authorizify"]
          
              close all browsers
