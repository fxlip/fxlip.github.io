---
title:  "Analisando a Frequência"
date:   2019-08-11 21:18:00
categories: [analytics]
tags: [bigdata]
---

Algoritmo que calcula a frequência de ocorrencias em determinada base de dados e retorna valores acumulados e relativos, além de valores intervalados através do método de sturges.

<!--mais-->


``` php
<?php
header('Content-Type: text/html; charset=utf-8');
$dados = array("27", "32", "33", "25", "33",
               "34", "26", "18", "35", "24",
               "19", "36", "29", "21", "38",
               "19", "22", "33", "19", "23",
               "39", "39", "25", "38", "28",
               "45", "31", "38", "44", "39");
asort($dados);
$k = round(1 + 3.22 * log10(round((max($dados)-min($dados)))));
function frequencia ($dados, $init, $limit, $primeiro=0) {
  $x = 0;
  if($primeiro==0) {
    foreach(array_values($dados) as $valor => $quantidade){
      if($quantidade>=$init && $quantidade<=$limit) {
        $x++;
      }
    }
  } else {
    foreach(array_values($dados) as $valor => $quantidade){
      if($quantidade>$init && $quantidade<=$limit) {
        $x++;
      }
    }
  }
  return $x;
}
?>
<table border="1">
  <thead>
	</thead>
    <thead>
      	<tr><th colspan="5">Tabela de Frequência</th></tr>
        <tr>
            <th>Valor</th>
            <th>Frequência</th>
            <th>Frequência Acumulada</th>
            <th>Frequência Relativa</th>
            <th>Frequência Relativa Acumulada</th>
        </tr>
    </thead>
    <tbody>
    <?php
      foreach(array_count_values($dados) as $valor => $frequencia){
        echo '<tr>';
          echo '<td>' . $valor . '</td>';
          echo '<td>' . $frequencia . '</td>';
          if(empty($ultimafrequencia)){
            echo '<td>' . $frequencia . '</td>';
              $ultimafrequencia = $frequencia;
          }
          else {
            if(empty($acumulado)) {
              $acumulado = $frequencia + $ultimafrequencia;
              echo '<td>' . $acumulado . '</td>';
            } else {
              $acumulado = $frequencia + $acumulado;
              echo '<td>' . $acumulado . '</td>';
            }
          }
          echo '<td>' . number_format(($frequencia * 100)/count($dados), 2, '.', '') . '%</td>';
          if(empty($ultimafrequencia_ac)){
            echo '<td>' . number_format(($frequencia * 100)/count($dados), 2, '.', '') . '%</td>';
            $ultimafrequencia_ac = number_format(($frequencia * 100)/count($dados), 2, '.', '');
          }
          else {
            if(empty($acumulado_rel)) {
              $acumulado_rel = number_format(($frequencia * 100)/count($dados), 2, '.', '') + $ultimafrequencia_ac;
              echo '<td>' . $acumulado_rel . '%</td>';
            } else {
              $acumulado_rel = number_format(($frequencia * 100)/count($dados), 2, '.', '') + $acumulado_rel;
              echo '<td>' . $acumulado_rel . '%</td>';
            }
          }
        echo '</tr>';
      }
    ?>
    </tbody>
</table>
<br><br><br>
<table border="1">
    <thead>
      	<tr><th colspan="5">Tabela de Frequência Intervalar</th></tr>
        <tr>
            <th>Faixa</th>
            <th>Frequência</th>
            <th>Frequência Acumulada</th>
            <th>Frequência Relativa</th>
            <th>Frequência Relativa Acumulada</th>
        </tr>
    </thead>
    <tbody>
    <?php
      $k = round(1 + 3.22 * log10(round((max($dados)-min($dados)))));
      for ($i=0; $i < $k; $i++) {
        echo '<tr>';
        if($i==0) {
          $init = min($dados);
          $limit = $init+$k-1;
          echo '<td>' . $init . '|-|' . $limit . '</td>';
        } else {
          if(empty($acumulado_intervalar)) {
            $acumulado_intervalar = $limit+$k-1;
            $int = $limit;
            $lmt = $acumulado_intervalar;
            echo '<td>' . $int . ' -|' . $lmt . '</td>';
          } else {
            if($i<($k-1)){
              $int = $acumulado_intervalar;
              $lmt = $acumulado_intervalar+$k-1;
              echo '<td>' . $int . ' -|' . $lmt . '</td>';
              $acumulado_intervalar = $acumulado_intervalar+$k-1;
            } else {
              $int = $acumulado_intervalar;
              $lmt = max($dados);
              echo '<td>' . $int . ' -|' . $lmt . '</td>';
              $acumulado_intervalar = max($dados);
            }
          }
        }
        if($i==0) {
          echo '<td>' . frequencia($dados, $init, $limit) . '</td>';
        } else {
          echo '<td>' . frequencia($dados, $int, $lmt, 1) . '</td>';
        }
        if(empty($freq_acumulada)){
          echo '<td>' . frequencia($dados, $init, $limit) . '</td>';
          $freq_acumulada = frequencia($dados, $init, $limit);
        }
        else {
          if(empty($next_freq_acumulada)) {
            $next_freq_acumulada = frequencia($dados, $int, $lmt, 1) + $freq_acumulada;
            echo '<td>' . $next_freq_acumulada . '</td>';
          } else {
            $next_freq_acumulada = frequencia($dados, $int, $lmt, 1) + $next_freq_acumulada;
            echo '<td>' . $next_freq_acumulada . '</td>';
          }
        }
        if($i==0) {
          echo '<td>' . number_format((frequencia($dados, $init, $limit) * 100)/count($dados), 2, '.', '') . '%</td>';
        } else {
          echo '<td>' . number_format((frequencia($dados, $int, $lmt, 1) * 100)/count($dados), 2, '.', '') . '%</td>';
        }
        if(empty($ultimafrequencia_ac_int)){
          echo '<td>' . number_format((frequencia($dados, $init, $limit) * 100)/count($dados), 2, '.', '') . '%</td>';
          $ultimafrequencia_ac_int = number_format((frequencia($dados, $init, $limit) * 100)/count($dados), 2, '.', '');
        }
        else {
          if(empty($acumulado_rel_int)) {
            $acumulado_rel_int = number_format((frequencia($dados, $int, $lmt, 1) * 100)/count($dados), 2, '.', '') + $ultimafrequencia_ac_int;
            echo '<td>' . $acumulado_rel_int . '%</td>';
          } else {
            $acumulado_rel_int = number_format((frequencia($dados, $int, $lmt, 1) * 100)/count($dados), 2, '.', '') + $acumulado_rel_int;
            echo '<td>' . $acumulado_rel_int . '%</td>';
          }
        }
        echo '</tr>';
      }
    ?>
    </tbody>
</table>
```
