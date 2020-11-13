vm = new ContactViewModel();

$(document).ready(initApp);

function initApp() {
  getUserProperties();
  ko.applyBindings(vm);
}

function ContactViewModel() {
  let self = this;
  this.currentUserProfile = ko.observable();

  this.requestId = ko.observable();
  this.requestorName = ko.observable();
  this.requestorTitle = ko.observable();
  this.requestorOfficeSymbol = ko.observable("cgfs");
  this.requestorTelephone = ko.observable();
  this.requestorEmail = ko.observable("");
  this.requestorType = ko.observable();
  this.requestorTypeOpts = ko.observableArray([
    "Employee",
    "Bureau HR Specialist",
    "Post Payroll Specialist",
  ]);

  this.requestTopic = ko.observable();
  this.requestTopicOpts = ko.observableArray([
    "Allowances",
    "Taxes",
    "General",
  ]);

  this.requestQuestion = ko.observable();

  this.mail = {
    to: ko.observable("cgfssharepoint@state.gov"),
    cc: ko.pureComputed(function () {
      return self.requestorEmail();
    }),
    subject: ko.pureComputed(function () {
      return `New ${self.requestTopic()} Request`;
    }),
    body: ko.pureComputed(function () {
      return encodeURIComponent(
        `Request ID: ${self.requestId()}\n` +
          `Requestor Name: ${self.requestorName()}\n` +
          `Requestor Title: ${self.requestorTitle()}\n` +
          `Requestor Office: ${self.requestorOfficeSymbol()}\n` +
          `Requestor Telephone: ${self.requestorTelephone()}\n` +
          `Requestor Email: ${self.requestorEmail()}\n` +
          `Requestor Type: ${self.requestorType()}\n` +
          `Request Topic: ${self.requestTopic()}\n\n` +
          `Request Question: ${self.requestQuestion()}\n`
      );
    }),
    link: ko.pureComputed(function () {
      return (
        `mailto:${self.mail.to()}?cc=${self.mail.cc()}` +
        `&subject=${self.mail.subject()}&body=${self.mail.body()}`
      );
    }),
    linkOWA: ko.pureComputed(function () {
      return (
        `https://outlook.live.com/mail/0/deeplink/compose?` +
        `to=${self.mail.to()}&cc=${self.mail.cc()}` +
        `&subject=${self.mail.subject()}&body=${self.mail.body()}`
      );
    }),
  };

  this.submitToOWA = function () {
    window.open(self.mail.linkOWA());
    self.requestConfirm();
  };

  this.submitToDesktop = function () {
    window.open(self.mail.link());
    self.requestConfirm();
  };

  this.requestConfirm = function () {
    if (
      window.confirm(
        "Was your request template successfully created in outlook?"
      )
    ) {
      if (window.alert("You may now close this page.")) {
      }
    }
  };
}

function getUserProperties() {
  var requestHeaders = {
    Accept: "application/json;odata=verbose",
    "X-RequestDigest": jQuery("#__REQUESTDIGEST").val(),
  };

  jQuery.ajax({
    url:
      _spPageContextInfo.webAbsoluteUrl +
      "/_api/SP.UserProfiles.PeopleManager/GetMyProperties",
    type: "GET",
    contentType: "application/json;odata=verbose",
    headers: requestHeaders,
    success: function (data) {
      let results = data.d.UserProfileProperties.results;

      vm.currentUserProfile(data.d);
      vm.requestorName(
        results.find(function (prop) {
          return prop.Key == "PreferredName";
        }).Value
      );
      vm.requestorTitle(
        results.find(function (prop) {
          return prop.Key == "Title";
        }).Value
      );
      vm.requestorOfficeSymbol(
        results.find(function (prop) {
          return prop.Key == "Department";
        }).Value
      );
      vm.requestorTelephone(
        results.find(function (prop) {
          return prop.Key == "WorkPhone";
        }).Value
      );
      vm.requestorEmail(
        results.find(function (prop) {
          return prop.Key == "WorkEmail";
        }).Value
      );
    },
    error: function (jqxr, errorCode, errorThrown) {
      console.error(jqxr.responseText);
    },
  });
}
