interface Employee {
  uniqueId: number;
  name: string;
  subordinates: Employee[];
}
enum Actions {
  MOVE = 'MOVE',
  UNDO = 'UNDO',
  REDO = 'REDO',
}
interface IHistory {
  employee: Employee;
  oldSupervisor: Employee | undefined;
  newSupervisor: Employee | undefined;
  type: Actions;
}
interface IEmployeeOrgApp {
  ceo: Employee;
  histories: IHistory[];
  /**
    * Moves the employee with employeeID (uniqueId) under a supervisor
    (another employee) that has supervisorID (uniqueId).
    * E.g. move Bob (employeeID) to be subordinate of Georgina
    (supervisorID). * @param employeeID
    * @param supervisorID
    */
  move(employeeID: number, supervisorID: number): void;
  /** Undo last move action */
  undo(): void;
  /** Redo last undone action */
  redo(): void;
  /** Store history */
  addHistories(history: IHistory): void;
  /** Find in subordinates */
  findEmployee(
    employee: Employee,
    employeeID: number,
    supervisor?: Employee | undefined
  ): Employee | undefined;
}

const ceo: Employee = {
  uniqueId: 1,
  name: 'Mark Zuckerberg',
  subordinates: [
    {
      uniqueId: 2,
      name: 'Sarah Donald',
      subordinates: [
        {
          uniqueId: 6,
          name: 'Cassandra Reynolds',
          subordinates: [
            {
              uniqueId: 11,
              name: 'Mary Blue',
              subordinates: [],
            },
            {
              uniqueId: 12,
              name: 'Bob Saget',
              subordinates: [
                {
                  uniqueId: 13,
                  name: 'Tina Teff',
                  subordinates: [
                    {
                      uniqueId: 14,
                      name: 'Will Turner',
                      subordinates: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      uniqueId: 3,
      name: 'Tyler Simpson',
      subordinates: [
        {
          uniqueId: 7,
          name: 'Harry Tobs',
          subordinates: [],
        },
        {
          uniqueId: 8,
          name: 'George Carrey',
          subordinates: [],
        },
        {
          uniqueId: 9,
          name: 'Gary Styles',
          subordinates: [],
        },
      ],
    },
    {
      uniqueId: 4,
      name: 'Bruce Willis',
      subordinates: [],
    },
    {
      uniqueId: 5,
      name: 'Georgina Flangy',
      subordinates: [
        {
          uniqueId: 10,
          name: 'Sophie Turner',
          subordinates: [],
        },
      ],
    },
  ], // TODO: insert later
};

class EmployeeOrgApp implements IEmployeeOrgApp {
  ceo: Employee;
  histories: IHistory[];

  constructor(ceo: Employee) {
    this.ceo = ceo;
    this.histories = [];
  }

  move(
    employeeID: number,
    supervisorID: number,
    subordinates?: Employee[],
    type?: Actions
  ) {
    const employeeResult:
      | { employee: Employee; supervisor: Employee | undefined }
      | undefined = this.findEmployee(this.ceo, employeeID);
    const supervisorResult:
      | { employee: Employee; supervisor: Employee | undefined }
      | undefined = this.findEmployee(this.ceo, supervisorID);
    if (!employeeResult || !supervisorResult) {
      throw new Error('Not found employee or supervisor');
    }
    // remove employee in old position
    this.removeFromOldSubordinates(
      employeeResult.employee,
      employeeResult.supervisor
    );
    // add employee in new position
    this.addToNewSubordinates(
      employeeResult.employee,
      supervisorResult.employee,
      subordinates
    );
    // add history
    const history: IHistory = {
      employee: employeeResult.employee,
      oldSupervisor: employeeResult.supervisor,
      newSupervisor: supervisorResult.employee,
      type: type ? type : Actions.MOVE,
    };
    this.addHistories(history);
    return this.ceo;
  }

  findEmployee(
    employee: Employee,
    employeeID: number,
    supervisor?: Employee | undefined
  ) {
    if (employee.uniqueId === employeeID) {
      return { employee, supervisor };
    }
    for (let empl of employee.subordinates) {
      const result = this.findEmployee(empl, employeeID, employee);
      if (result) {
        return result;
      }
    }
    return undefined;
  }

  undo() {
    const lastAction: IHistory = this.histories[this.histories.length - 1];
    const { employee, oldSupervisor, newSupervisor } = lastAction;
    this.removeSubordinatesFromSupervisor(employee, oldSupervisor);
    this.move(
      employee.uniqueId,
      oldSupervisor?.uniqueId!,
      employee.subordinates,
      Actions.UNDO
    );
    return this.ceo;
  }

  redo() {
    const lastMoveAction: IHistory | undefined = this.histories
      .reverse()
      .find((history: IHistory) => history.type === Actions.MOVE);
    if (!lastMoveAction) {
      throw new Error('Should move before redo');
    }
    const { employee, oldSupervisor, newSupervisor } = lastMoveAction;
    console.log(employee);
    console.log(newSupervisor);
    this.removeSubordinatesFromSupervisor(employee, oldSupervisor);
    this.move(employee.uniqueId, newSupervisor?.uniqueId!, [], Actions.REDO);
    return this.ceo;
  }

  addHistories(history: IHistory) {
    this.histories.push(history);
  }

  removeFromOldSubordinates(
    employee: Employee,
    supervisor?: Employee | undefined
  ) {
    if (!supervisor) {
      return this.ceo;
    }
    const clonedSubordinates = [...supervisor.subordinates];
    const foundEmployeeIndex: number = clonedSubordinates.findIndex(
      (empl: Employee) => empl.uniqueId === employee.uniqueId
    );
    const foundEmployeeSubordinates: Employee[] = [
      ...clonedSubordinates[foundEmployeeIndex].subordinates,
    ];
    clonedSubordinates.splice(foundEmployeeIndex, 1);
    supervisor.subordinates = [
      ...clonedSubordinates,
      ...foundEmployeeSubordinates,
    ];
    return this.ceo;
  }

  addToNewSubordinates(
    employee: Employee,
    supervisor?: Employee | undefined,
    subordinates?: Employee[]
  ) {
    if (!supervisor) {
      return this.ceo;
    }
    supervisor.subordinates = [
      ...supervisor.subordinates,
      { ...employee, subordinates: subordinates ? subordinates : [] },
    ];
    return this.ceo;
  }

  removeSubordinatesFromSupervisor(
    employee: Employee,
    supervisor: Employee | undefined
  ) {
    if (supervisor) {
      const filteredSubordinates = supervisor.subordinates.filter(
        (superEmpl: Employee | undefined) => {
          const foundEmpl = employee.subordinates.find(
            (empl: Employee | undefined) => {
              return superEmpl?.uniqueId === empl?.uniqueId;
            }
          );
          return !foundEmpl;
        }
      );
      supervisor.subordinates = filteredSubordinates;
    }
    return this.ceo;
  }
}

const app = new EmployeeOrgApp(ceo);
const moveResult = app.move(6, 3);
console.log(JSON.stringify(moveResult));
const undoResult = app.undo();
console.log(JSON.stringify(undoResult));
const redoResult = app.redo();
console.log(JSON.stringify(redoResult));
