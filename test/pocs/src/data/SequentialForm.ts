export var sequentialForm = {
   "@element": "forms:form",
   "element": "sequential",
   "title": "sequential",
   "formItems": [
      {
         "@element": "forms:text",
         "property": "id",
         "title": "Id",
         "value": "jobs"
      },
      {
         "@element": "forms:group",
         "title": "General",
         "bordered": "true",
         "formItems": {
            "@element": "forms:text",
            "property": "name",
            "title": "Name"
         }
      },
      {
         "@element": "forms:group",
         "title": "Optional Behaviour",
         "bordered": "true",
         "formItems": [
            {
               "@element": "forms:text",
               "property": "independent",
               "title": "Independent"
            },
            {
               "@element": "forms:text",
               "property": "stateOperator",
               "title": "State Operator"
            },
            {
               "@element": "forms:text",
               "property": "transient",
               "title": "Transient"
            }
         ]
      },
      {
         "@element": "forms:group",
         "title": "Jobs",
         "bordered": "true",
         "formItems": {
            "@element": "forms:indexed",
            "title": "",
            "property": "jobs",
            "options": "archive,archive-browser,bean,bean-bus,bean-report,cascade,check,copy,delete,depends,echo,exec,exists,explorer,folder,foreach,grab,grep,input,invoke,is,java,launch,mkdir,oddjob,parallel,properties,rename,repeat,reset,rmireg,run,script,sequence,sequential,services,set,sql,sql-keeper-service,sql-persister-service,start,stop,task-request,task-service,variables,wait,events:file-watch,events:file-watch-service,events:for,events:list,events:trigger,events:when,jmx:client,jmx:server,jmx:service,scheduling:retry,scheduling:timer,scheduling:trigger,state:and,state:cascade,state:equals,state:evaluate,state:flag,state:if,state:join,state:mirror,state:or,state:resets,state:watch,web:client,web:remote-client,web:server",
            "propertyClass": "java.lang.Object",
            "component": "true",
            "value": [
               {
                  "@element": "forms:form",
                  "element": "echo",
                  "title": "echo",
                  "formItems": [
                     {
                        "@element": "forms:text",
                        "property": "id",
                        "title": "Id",
                        "value": "job1"
                     },
                     {
                        "@element": "forms:group",
                        "title": "General",
                        "bordered": "true",
                        "formItems": {
                           "@element": "forms:text",
                           "property": "name",
                           "title": "Name",
                           "value": "Echo Hello"
                        }
                     },
                     {
                        "@element": "forms:group",
                        "title": "Text",
                        "bordered": "true",
                        "formItems": {
                           "@element": "forms:radio",
                           "title": "select",
                           "formItems": [
                              {
                                 "@element": "forms:text-area",
                                 "title": "Text",
                                 "value": "Hello"
                              },
                              {
                                 "@element": "forms:single",
                                 "title": "Lines",
                                 "property": "lines",
                                 "options": "append,bean,buffer,class,convert,date,file,file-persister,files,format,identify,import,input-confirm,input-file,input-message,input-password,input-text,invoke,list,logout,oddballs,properties,resource,schedule,sql-results-bean,sql-results-sheet,stderr,stdin,stdout,tee,tokenizer,url-class-loader,value,xml,arooa:annotation,arooa:bean-def,arooa:descriptor,arooa:descriptors,arooa:magic-beans,arooa:property,design:form,design:group,design:indexed,design:mapped,design:radio,design:single,design:tabs,design:text,design:textarea,events:all,events:any,schedules:after,schedules:broken,schedules:count,schedules:daily,schedules:date,schedules:day-after,schedules:day-before,schedules:interval,schedules:last,schedules:list,schedules:monthly,schedules:now,schedules:time,schedules:weekly,schedules:yearly",
                                 "propertyClass": "[Ljava.lang.String;"
                              }
                           ]
                        }
                     },
                     {
                        "@element": "forms:group",
                        "title": "Output",
                        "bordered": "true",
                        "formItems": {
                           "@element": "forms:single",
                           "title": "Output",
                           "property": "output",
                           "options": "append,bean,buffer,convert,file,format,identify,import,invoke,logout,resource,stderr,stdout,tee,value,xml",
                           "propertyClass": "java.io.OutputStream"
                        }
                     }
                  ]
               },
               {
                  "@element": "forms:form",
                  "element": "echo",
                  "title": "echo",
                  "formItems": [
                     {
                        "@element": "forms:text",
                        "property": "id",
                        "title": "Id",
                        "value": "job2"
                     },
                     {
                        "@element": "forms:group",
                        "title": "General",
                        "bordered": "true",
                        "formItems": {
                           "@element": "forms:text",
                           "property": "name",
                           "title": "Name",
                           "value": "Echo World"
                        }
                     },
                     {
                        "@element": "forms:group",
                        "title": "Text",
                        "bordered": "true",
                        "formItems": {
                           "@element": "forms:radio",
                           "title": "select",
                           "formItems": [
                              {
                                 "@element": "forms:text-area",
                                 "title": "Text",
                                 "value": "World"
                              },
                              {
                                 "@element": "forms:single",
                                 "title": "Lines",
                                 "property": "lines",
                                 "options": "append,bean,buffer,class,convert,date,file,file-persister,files,format,identify,import,input-confirm,input-file,input-message,input-password,input-text,invoke,list,logout,oddballs,properties,resource,schedule,sql-results-bean,sql-results-sheet,stderr,stdin,stdout,tee,tokenizer,url-class-loader,value,xml,arooa:annotation,arooa:bean-def,arooa:descriptor,arooa:descriptors,arooa:magic-beans,arooa:property,design:form,design:group,design:indexed,design:mapped,design:radio,design:single,design:tabs,design:text,design:textarea,events:all,events:any,schedules:after,schedules:broken,schedules:count,schedules:daily,schedules:date,schedules:day-after,schedules:day-before,schedules:interval,schedules:last,schedules:list,schedules:monthly,schedules:now,schedules:time,schedules:weekly,schedules:yearly",
                                 "propertyClass": "[Ljava.lang.String;"
                              }
                           ]
                        }
                     },
                     {
                        "@element": "forms:group",
                        "title": "Output",
                        "bordered": "true",
                        "formItems": {
                           "@element": "forms:single",
                           "title": "Output",
                           "property": "output",
                           "options": "append,bean,buffer,convert,file,format,identify,import,invoke,logout,resource,stderr,stdout,tee,value,xml",
                           "propertyClass": "java.io.OutputStream"
                        }
                     }
                  ]
               }
            ]
         }
      }
   ]
}